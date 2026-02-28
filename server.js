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
// OFFLINE CARDS
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
// POSTGRES (Supabase)
// =========================
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing env DATABASE_URL (set it in Render)");
  process.exit(1);
}

// Supabase Postgres => SSL requis en général
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  // test connexion
  const client = await pool.connect();
  try {
    const r = await client.query("select now() as now");
    console.log("✅ Postgres connected:", r.rows[0].now);
  } finally {
    client.release();
  }

  // tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
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

// ----- PAY LOOP (server-side) -----
const PAY_AMOUNT = 10;
const PAY_EVERY_MS = 5 * 60 * 1000;

async function applyPayForUser(userId) {
  const { rows } = await pool.query(`SELECT money, lastPay FROM users WHERE id=$1`, [userId]);
  const u = rows[0];
  if (!u) return;

  const now = Date.now();
  const last = Number(u.lastpay || u.lastPay || 0) || now; // sécurité
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

function normalizeImageUrl(imgUrl) {
  if (!imgUrl) return null;

  if (typeof imgUrl === "object") {
    imgUrl = imgUrl.high || imgUrl.large || imgUrl.medium || imgUrl.small || imgUrl.url || null;
  }
  if (typeof imgUrl !== "string") return null;

  const hasExt = /\.(png|jpe?g|webp)(\?|$)/i.test(imgUrl);
  if (!hasExt) imgUrl = imgUrl.replace(/\/$/, "") + "/high.png";

  return imgUrl;
}

async function drawCard() {
  // 1) offline prioritaire si présent
  if (offlineCards?.length) {
    const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
    if (c?.image) return c;
  }

  // si tu veux TCGdex => mets FORCE_OFFLINE=0
  if (FORCE_OFFLINE) {
    throw new Error("Offline only: no cards.json");
  }

  // 2) online retries
  const MAX_TRIES = 6;

  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const r = await fetchWithTimeout("https://api.tcgdex.net/v2/fr/cards", 20000);
    if (!r.ok) continue;

    const cards = await r.json().catch(() => null);
    if (!Array.isArray(cards) || cards.length === 0) continue;

    const pick = cards[Math.floor(Math.random() * cards.length)];
    if (!pick?.id) continue;

    const r2 = await fetchWithTimeout(`https://api.tcgdex.net/v2/fr/cards/${pick.id}`, 20000);
    if (!r2.ok) continue;

    const c = await r2.json().catch(() => null);
    if (!c) continue;

    const img = normalizeImageUrl(c.image);
    if (!img) continue;

    return {
      name: c.name || pick.name || "Unknown",
      set: (c.set && (c.set.name || c.set.id)) || "Unknown",
      rarity: c.rarity || "",
      image: img,
    };
  }

  // 3) dernière chance offline
  if (offlineCards?.length) {
    const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
    if (c?.image) return c;
  }

  throw new Error("No image (TCGdex)");
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

    await pool.query(
      `INSERT INTO users (name, code, token, money, lastPay, createdAt)
       VALUES ($1,$2,$3,0,$4,$5)`,
      [name, newCode, token, now, now]
    );

    return res.json({ token, isNew: true, code: newCode });
  }

  // Compte existant -> code obligatoire
  if (!code || code !== u.code) {
    return res.status(401).json({ error: "Code incorrect" });
  }

  return res.json({ token: u.token, isNew: false });
});

app.get("/api/me", auth, async (req, res) => {
  await applyPayForUser(req.user.id);
  const { rows } = await pool.query(`SELECT name, money FROM users WHERE id=$1`, [req.user.id]);
  const u = rows[0];
  res.json({ name: u?.name, money: u?.money || 0 });
});

app.post("/api/open", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const { rows } = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
  const money = rows[0]?.money ?? 0;

  if (money < COST_ONE) {
    return res.status(400).json({ error: "Pas assez de Pokédollars" });
  }

  // spend
  await pool.query(`UPDATE users SET money = money - $1 WHERE id=$2`, [COST_ONE, req.user.id]);

  // draw
  let c;
  try {
    c = await drawCard();
  } catch (e) {
    // remboursement
    await pool.query(`UPDATE users SET money = money + $1 WHERE id=$2`, [COST_ONE, req.user.id]);
    return res.status(502).json({ error: "Erreur image (réessaie)" });
  }

  const grade = rollGrade();
  const mint = rollMintForGrade(grade);
  const now = Date.now();

  const idKey = `${c.name}__${c.set}__${c.image}`;

  // pulls log
  await pool.query(
    `INSERT INTO pulls (user_id, name, setName, image, grade, mint, at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [req.user.id, c.name, c.set, c.image, grade, mint, now]
  );

  // upsert collection (Postgres)
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
      image: c.image,
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