import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

// =========================
// OFFLINE CARDS (fallback)
// =========================
const FORCE_OFFLINE = process.env.FORCE_OFFLINE === "1";
const OFFLINE_PATH = path.join(__dirname, "data", "cards.json");

let offlineCards = null;

function loadOffline() {
  try {
    if (fs.existsSync(OFFLINE_PATH)) {
      const raw = fs.readFileSync(OFFLINE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        offlineCards = parsed;
        console.log(`📦 Offline loaded: ${offlineCards.length} cards`);
      } else {
        console.log("📦 Offline cards.json present but empty/invalid array");
      }
    } else {
      console.log("📦 No offline cards.json found at", OFFLINE_PATH);
    }
  } catch (e) {
    console.log("Offline load error:", e.message);
  }
}
loadOffline();

console.log(`🧩 FORCE_OFFLINE=${FORCE_OFFLINE ? "ON" : "OFF"}`);
console.log(`📦 Offline cards: ${offlineCards?.length || 0}`);

// =========================
// STATIC
// =========================
app.use(express.static(__dirname));
app.use(
  "/data",
  express.static(path.join(__dirname, "data"), {
    setHeaders(res) {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

// =========================
// POSTGRES
// =========================
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing env DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  const client = await pool.connect();
  try {
    const r = await client.query("select now() as now");
    console.log("✅ Postgres connected:", r.rows[0].now);
  } finally {
    client.release();
  }

  // tables de base
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      friendCode TEXT UNIQUE,
      money INTEGER NOT NULL DEFAULT 0,
      lastPay BIGINT NOT NULL DEFAULT 0,
      createdAt BIGINT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collection (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      idKey TEXT NOT NULL,
      name TEXT NOT NULL,
      setName TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      count INTEGER NOT NULL DEFAULT 1,
      lastAt BIGINT NOT NULL,
      PRIMARY KEY(user_id, idKey)
    );

    CREATE TABLE IF NOT EXISTS pulls (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      setName TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      at BIGINT NOT NULL
    );
  `);

  // migration safe si la DB existe déjà
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS friendCode TEXT UNIQUE;
  `);

  // table friends
  await pool.query(`
    CREATE TABLE IF NOT EXISTS friends (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      createdAt BIGINT NOT NULL,
      PRIMARY KEY(user_id, friend_user_id)
    );
  `);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS market_listings (
    id SERIAL PRIMARY KEY,
    seller_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idKey TEXT NOT NULL,
    name TEXT NOT NULL,
    setName TEXT NOT NULL,
    image TEXT NOT NULL,
    grade INTEGER NOT NULL,
    mint INTEGER NOT NULL DEFAULT 0,
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    createdAt BIGINT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_market_listings_created 
  ON market_listings(createdAt DESC);

  CREATE INDEX IF NOT EXISTS idx_market_listings_seller 
  ON market_listings(seller_user_id);
`);

  console.log("✅ Postgres DB ready");
}

// =========================
// HELPERS
// =========================
function randCode(len = 6) {
  return String(Math.floor(Math.random() * Math.pow(10, len))).padStart(len, "0");
}

function randToken() {
  return crypto.randomBytes(24).toString("hex");
}

function randFriendCode() {
  const s = crypto.randomBytes(4).toString("hex").toUpperCase();
  return s.slice(0, 4) + "-" + s.slice(4, 8);
}

// ----- PAY LOOP (server-side) -----
const PAY_AMOUNT = 10;
const PAY_EVERY_MS = 5 * 60 * 1000;

async function applyPayForUser(userId) {
  const { rows } = await pool.query(`SELECT money, lastPay FROM users WHERE id=$1`, [userId]);
  const u = rows[0];
  if (!u) return;

  const now = Date.now();
  const last = Number(u.lastpay ?? u.lastPay ?? 0) || now;
  const delta = Math.max(0, now - last);
  const ticks = Math.floor(delta / PAY_EVERY_MS);

  if (ticks > 0) {
    const add = ticks * PAY_AMOUNT;
    const newLast = last + ticks * PAY_EVERY_MS;
    await pool.query(
      `UPDATE users SET money = money + $1, lastPay=$2 WHERE id=$3`,
      [add, newLast, userId]
    );
  }
}

// ----- AUTH -----
async function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  const { rows } = await pool.query(`SELECT id, name FROM users WHERE token=$1`, [token]);
  const u = rows[0];
  if (!u) return res.status(401).json({ error: "Invalid token" });

  req.user = u;
  next();
}

// ----- HTTP fetch with timeout -----
async function fetchWithTimeout(url, ms = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// =========================
// TCGDEX PERF: CACHE LIST + CACHE DETAILS
// =========================
const CARDS_LIST_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const CARD_DETAIL_TTL_MS = 24 * 60 * 60 * 1000; // 24h

let cardsBriefCache = { at: 0, list: [] };
const cardDetailCache = new Map();

async function getCardsBriefList() {
  const now = Date.now();
  if (cardsBriefCache.list.length && now - cardsBriefCache.at < CARDS_LIST_TTL_MS) {
    return cardsBriefCache.list;
  }

  const r = await fetchWithTimeout("https://api.tcgdex.net/v2/fr/cards", 20000);
  if (!r.ok) throw new Error("TCGdex list failed");

  const list = await r.json().catch(() => null);
  if (!Array.isArray(list) || !list.length) throw new Error("TCGdex list empty");

  cardsBriefCache = { at: now, list };
  console.log(`🌐 cached cards list: ${list.length} items`);
  return list;
}

async function getCardDetailById(id) {
  const now = Date.now();
  const cached = cardDetailCache.get(id);
  if (cached && now - cached.at < CARD_DETAIL_TTL_MS) return cached.data;

  const r = await fetchWithTimeout(`https://api.tcgdex.net/v2/fr/cards/${id}`, 20000);
  if (!r.ok) throw new Error("TCGdex detail failed");

  const data = await r.json().catch(() => null);
  if (!data) throw new Error("TCGdex detail invalid");

  cardDetailCache.set(id, { at: now, data });
  return data;
}

// =========================
// IMAGE URL NORMALIZATION
// low.webp pour afficher vite, high.webp pour zoom
// =========================
function buildTcgdexAsset(urlBaseOrWithExt, quality = "low", ext = "webp") {
  if (!urlBaseOrWithExt || typeof urlBaseOrWithExt !== "string") return null;
  const hasExt = /\.(png|jpe?g|webp)(\?|$)/i.test(urlBaseOrWithExt);
  if (hasExt) return urlBaseOrWithExt;
  return urlBaseOrWithExt.replace(/\/$/, "") + `/${quality}.${ext}`;
}

function normalizeImageField(imageField, quality = "low", ext = "webp") {
  if (!imageField) return null;

  let base = imageField;
  if (typeof imageField === "object") {
    base =
      imageField[quality] ||
      imageField.high ||
      imageField.low ||
      imageField.large ||
      imageField.medium ||
      imageField.small ||
      imageField.url ||
      null;
  }
  if (typeof base !== "string") return null;

  return buildTcgdexAsset(base, quality, ext);
}

// =========================
// DRAW CARD
// =========================
async function drawCard() {
  if (FORCE_OFFLINE) {
    if (offlineCards?.length) {
      const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
      if (c?.image) return c;
    }
    throw new Error("Offline only: no cards.json");
  }

  const MAX_TRIES = 6;

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    let list;
    try {
      list = await getCardsBriefList();
    } catch {
      list = null;
    }
    if (!list?.length) break;

    const pick = list[Math.floor(Math.random() * list.length)];
    if (!pick?.id) continue;

    let c;
    try {
      c = await getCardDetailById(pick.id);
    } catch {
      continue;
    }

    const imageLow = normalizeImageField(c.image, "low", "webp");
    const imageHigh = normalizeImageField(c.image, "high", "webp");
    if (!imageLow) continue;

    console.log("🌐 source=TCGDEX (cached)");

    return {
      name: c.name || pick.name || "Unknown",
      set: (c.set && (c.set.name || c.set.id)) || "Unknown",
      rarity: c.rarity || "",
      image: imageLow,
      imageHigh: imageHigh || null,
    };
  }

  if (offlineCards?.length) {
    const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
    if (c?.image) {
      console.log("📦 source=OFFLINE");
      return c;
    }
  }

  throw new Error("No card available (TCGdex + offline empty)");
}

// ----- GRADES -----
function rollGrade() {
  const r = Math.random();
  if (r < 0.02) return 10;
  if (r < 0.10) return 9;
  if (r < 0.20) return 8;
  if (r < 0.34) return 7;
  if (r < 0.52) return 6;
  if (r < 0.70) return 5;
  if (r < 0.82) return 4;
  if (r < 0.91) return 3;
  if (r < 0.97) return 2;
  return 1;
}

function rollMintForGrade(grade) {
  if (grade !== 10) return 0;
  return Math.random() < 1 / 3 ? 1 : 0;
}

const COST_ONE = 5;

// =========================
// ROUTES
// =========================
app.post("/api/login", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const code = String(req.body?.code || "").trim();
  if (!name) return res.status(400).json({ error: "Pseudo requis" });

  const now = Date.now();
  const existing = await pool.query(`SELECT id, code, token FROM users WHERE name=$1`, [name]);
  const u = existing.rows[0];

  // Nouveau compte
  if (!u) {
    const newCode = randCode(6);
    const token = randToken();
    const friendCode = randFriendCode();

    await pool.query(
      `INSERT INTO users (name, code, token, friendCode, money, lastPay, createdAt)
       VALUES ($1,$2,$3,$4,0,$5,$6)`,
      [name, newCode, token, friendCode, now, now]
    );

    return res.json({ token, isNew: true, code: newCode, friendCode });
  }

  // Compte existant -> code obligatoire
  if (!code || code !== u.code) {
    return res.status(401).json({ error: "Code incorrect" });
  }

  return res.json({ token: u.token, isNew: false });
});

app.get("/api/me", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const userQ = await pool.query(
    `SELECT name, money, friendCode FROM users WHERE id=$1`,
    [req.user.id]
  );
  const u = userQ.rows[0];

  // si ancien compte sans friendCode
  let friendCode = u?.friendcode || u?.friendCode || null;
  if (!friendCode) {
    friendCode = randFriendCode();
    for (let i = 0; i < 3; i++) {
      try {
        await pool.query(`UPDATE users SET friendCode=$1 WHERE id=$2`, [friendCode, req.user.id]);
        break;
      } catch {
        friendCode = randFriendCode();
      }
    }
  }

  // stats pulls
  const statsQ = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN grade BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS w,
      SUM(CASE WHEN grade BETWEEN 5 AND 6 THEN 1 ELSE 0 END)::int AS b,
      SUM(CASE WHEN grade BETWEEN 7 AND 9 THEN 1 ELSE 0 END)::int AS v,
      SUM(CASE WHEN grade = 10 THEN 1 ELSE 0 END)::int AS g10,
      SUM(CASE WHEN mint = 1 THEN 1 ELSE 0 END)::int AS mint
    FROM pulls
    WHERE user_id=$1
    `,
    [req.user.id]
  );

  const s = statsQ.rows[0] || {};

  res.json({
    name: u?.name,
    money: u?.money || 0,
    friendCode,
    total: s.total || 0,
    w: s.w || 0,
    b: s.b || 0,
    v: s.v || 0,
    g10: s.g10 || 0,
    mint: s.mint || 0,
  });
});

app.post("/api/open", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const { rows } = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
  const money = rows[0]?.money ?? 0;

  if (money < COST_ONE) {
    return res.status(400).json({ error: "Pas assez de Pokédollars" });
  }

  await pool.query(`UPDATE users SET money = money - $1 WHERE id=$2`, [COST_ONE, req.user.id]);

  let c;
  try {
    c = await drawCard();
  } catch (e) {
    await pool.query(`UPDATE users SET money = money + $1 WHERE id=$2`, [COST_ONE, req.user.id]);
    return res.status(502).json({ error: "Erreur image (réessaie)" });
  }

  const grade = rollGrade();
  const mint = rollMintForGrade(grade);
  const now = Date.now();

  const idKey = `${c.name}__${c.set}__${c.image}`;

  await pool.query(
    `INSERT INTO pulls (user_id, name, setName, image, grade, mint, at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [req.user.id, c.name, c.set, c.image, grade, mint, now]
  );

  await pool.query(
    `
    INSERT INTO collection (user_id, idKey, name, setName, image, grade, mint, count, lastAt)
    VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)
    ON CONFLICT (user_id, idKey)
    DO UPDATE SET
      count = collection.count + 1,
      grade = GREATEST(collection.grade, EXCLUDED.grade),
      mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
      lastAt = EXCLUDED.lastAt
    `,
    [req.user.id, idKey, c.name, c.set, c.image, grade, mint, now]
  );

  const me = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);

  res.json({
    money: me.rows[0]?.money || 0,
    card: {
      name: c.name,
      set: c.set,
      image: c.image, // low.webp
      imageHigh: c.imageHigh, // optionnel pour zoom
      grade,
      mint: Boolean(mint),
    },
  });
});

app.get("/api/collection", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const items = await pool.query(
    `SELECT idKey, name, setName, image, grade, mint, count, lastAt
     FROM collection
     WHERE user_id=$1
     ORDER BY lastAt DESC`,
    [req.user.id]
  );

  const me = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);

  res.json({
    money: me.rows[0]?.money || 0,
    items: items.rows.map((x) => ({
      idKey: x.idkey || x.idKey,
      name: x.name,
      set: x.setname || x.setName,
      image: x.image,
      grade: x.grade,
      mint: Boolean(x.mint),
      count: x.count,
      lastAt: Number(x.lastat || x.lastAt),
    })),
  });
});

app.get("/api/pulls", auth, async (req, res) => {
  const rows = await pool.query(
    `SELECT name, setName, image, grade, mint, at
     FROM pulls
     WHERE user_id=$1
     ORDER BY at DESC
     LIMIT 80`,
    [req.user.id]
  );

  res.json({
    pulls: rows.rows.map((r) => ({
      name: r.name,
      set: r.setname || r.setName,
      image: r.image,
      grade: r.grade,
      mint: Boolean(r.mint),
      at: Number(r.at),
    })),
  });
});

app.post("/api/sell", auth, async (req, res) => {
  const idKey = String(req.body?.idKey || "");
  if (!idKey) return res.status(400).json({ error: "Missing idKey" });

  const item = await pool.query(
    `SELECT count FROM collection WHERE user_id=$1 AND idKey=$2`,
    [req.user.id, idKey]
  );
  const it = item.rows[0];
  if (!it) return res.status(404).json({ error: "Not owned" });

  if (it.count <= 1) {
    await pool.query(`DELETE FROM collection WHERE user_id=$1 AND idKey=$2`, [req.user.id, idKey]);
  } else {
    await pool.query(
      `UPDATE collection SET count = count - 1 WHERE user_id=$1 AND idKey=$2`,
      [req.user.id, idKey]
    );
  }

  await pool.query(`UPDATE users SET money = money + 1 WHERE id=$1`, [req.user.id]);

  const me = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
  res.json({ ok: true, money: me.rows[0]?.money || 0 });
});

// =========================
// FRIENDS ROUTES
// =========================
app.post("/api/friends/add", auth, async (req, res) => {
  const friendCode = String(req.body?.friendCode || "").trim().toUpperCase();
  if (!friendCode) return res.status(400).json({ error: "Missing friendCode" });

  const qFriend = await pool.query(`SELECT id, name, friendCode FROM users WHERE friendCode=$1`, [
    friendCode,
  ]);
  const friend = qFriend.rows[0];
  if (!friend) return res.status(404).json({ error: "Ami introuvable" });

  if (friend.id === req.user.id) {
    return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même" });
  }

  await pool.query(
    `INSERT INTO friends (user_id, friend_user_id, createdAt)
     VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [req.user.id, friend.id, Date.now()]
  );

  res.json({
    ok: true,
    friend: { name: friend.name, friendCode: friend.friendcode || friend.friendCode },
  });
});

app.get("/api/friends", auth, async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT u.name, u.friendCode
    FROM friends f
    JOIN users u ON u.id = f.friend_user_id
    WHERE f.user_id=$1
    ORDER BY u.name ASC
    `,
    [req.user.id]
  );

  res.json({
    friends: rows.map((r) => ({
      name: r.name,
      friendCode: r.friendcode || r.friendCode,
    })),
  });
});

app.get("/api/friends/:friendCode/collection", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const friendCode = String(req.params.friendCode || "").trim().toUpperCase();
  if (!friendCode) return res.status(400).json({ error: "Missing friendCode" });

  const q = await pool.query(
    `
    SELECT u.id
    FROM friends f
    JOIN users u ON u.id = f.friend_user_id
    WHERE f.user_id=$1 AND u.friendCode=$2
    `,
    [req.user.id, friendCode]
  );

  const friend = q.rows[0];
  if (!friend) return res.status(403).json({ error: "Pas dans tes amis" });

  const items = await pool.query(
    `SELECT idKey, name, setName, image, grade, mint, count, lastAt
     FROM collection
     WHERE user_id=$1
     ORDER BY lastAt DESC`,
    [friend.id]
  );

  res.json({
    items: items.rows.map((x) => ({
      idKey: x.idkey || x.idKey,
      name: x.name,
      setName: x.setname || x.setName,
      image: x.image,
      grade: x.grade,
      mint: Boolean(x.mint),
      count: x.count,
      lastAt: Number(x.lastat || x.lastAt),
    })),
  });
});

// =========================
// START
// =========================
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
      console.log(`✅ Render PORT env is ${process.env.PORT || "(not set locally)"}`);
    });
  })
  .catch((e) => {
    console.error("❌ DB init error:", e);
    process.exit(1);
  });