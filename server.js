import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import pg from "pg";
const { Pool } = pg;

const app = express();
app.use(express.json());

const FORCE_OFFLINE = process.env.FORCE_OFFLINE === "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

// ----- STATIC -----
app.use(express.static(__dirname));
app.use(
  "/data",
  express.static(path.join(__dirname, "data"), {
    setHeaders(res) {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

console.log(`✅ http://localhost:${PORT}`);

// ----- OFFLINE CARDS -----
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
      }
    }
  } catch (e) {
    console.log("Offline load error:", e.message);
  }
}
loadOffline();

console.log(`🧩 FORCE_OFFLINE=${FORCE_OFFLINE ? "ON" : "OFF"}`);
console.log(`📦 Offline cards: ${offlineCards?.length || 0}`);

// ----- DB (Postgres / Supabase) -----
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL env var (Render -> Environment)");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // nécessaire pour Supabase
});

// helpers (style sqlite)
async function dbGet(sql, params = []) {
  const r = await pool.query(sql, params);
  return r.rows[0] || null;
}
async function dbAll(sql, params = []) {
  const r = await pool.query(sql, params);
  return r.rows;
}
async function dbRun(sql, params = []) {
  return pool.query(sql, params);
}

async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      money INTEGER NOT NULL DEFAULT 0,
      lastpay BIGINT NOT NULL DEFAULT 0,
      createdat BIGINT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collection (
      user_id BIGINT NOT NULL,
      idkey TEXT NOT NULL,
      name TEXT NOT NULL,
      setname TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      count INTEGER NOT NULL DEFAULT 1,
      lastat BIGINT NOT NULL,
      PRIMARY KEY (user_id, idkey)
    );

    CREATE TABLE IF NOT EXISTS pulls (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      name TEXT NOT NULL,
      setname TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      at BIGINT NOT NULL
    );
  `);

  console.log("✅ Postgres DB ready");
}

// ----- UTILS -----
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
  const u = await dbGet(`SELECT money, lastpay FROM users WHERE id=$1`, [userId]);
  if (!u) return;

  const now = Date.now();
  const last = Number(u.lastpay || now);
  const delta = Math.max(0, now - last);
  const ticks = Math.floor(delta / PAY_EVERY_MS);

  if (ticks > 0) {
    const add = ticks * PAY_AMOUNT;
    const newLast = last + ticks * PAY_EVERY_MS;
    await dbRun(`UPDATE users SET money = money + $1, lastpay=$2 WHERE id=$3`, [
      add,
      newLast,
      userId,
    ]);
  }
}

// ----- AUTH -----
async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    const u = await dbGet(`SELECT id, name FROM users WHERE token=$1`, [token]);
    if (!u) return res.status(401).json({ error: "Invalid token" });

    req.user = u;
    next();
  } catch (e) {
    console.error("Auth error:", e);
    res.status(500).json({ error: "Server error" });
  }
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

// ----- CARD FETCH -----
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
  // 1) offline prioritaire
  if (offlineCards?.length) {
    const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
    if (c?.image) return c;
  }

  // en prod: pas d'online si FORCE_OFFLINE=1
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

// ----- ROUTES -----

// Login: pseudo + code (optionnel)
app.post("/api/login", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const code = String(req.body?.code || "").trim();

    if (!name) return res.status(400).json({ error: "Pseudo requis" });

    const now = Date.now();

    const existing = await dbGet(`SELECT id, code, token FROM users WHERE name=$1`, [name]);

    // Nouveau compte
    if (!existing) {
      const newCode = randCode(6);
      const token = randToken();

      await dbRun(
        `INSERT INTO users (name, code, token, money, lastpay, createdat)
         VALUES ($1, $2, $3, 0, $4, $5)`,
        [name, newCode, token, now, now]
      );

      return res.json({ token, isNew: true, code: newCode });
    }

    // Compte existant -> code obligatoire
    if (!code || code !== existing.code) {
      return res.status(401).json({ error: "Code incorrect" });
    }

    return res.json({ token: existing.token, isNew: false });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Infos money
app.get("/api/me", auth, async (req, res) => {
  try {
    await applyPayForUser(req.user.id);
    const u = await dbGet(`SELECT name, money FROM users WHERE id=$1`, [req.user.id]);
    res.json({ name: u?.name, money: u?.money || 0 });
  } catch (e) {
    console.error("Me error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Tirage
app.post("/api/open", auth, async (req, res) => {
  try {
    await applyPayForUser(req.user.id);

    const u = await dbGet(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
    const money = u?.money ?? 0;

    if (money < COST_ONE) {
      return res.status(400).json({ error: "Pas assez de Pokédollars" });
    }

    // spend
    await dbRun(`UPDATE users SET money = money - $1 WHERE id=$2`, [COST_ONE, req.user.id]);

    // drawCard safe
    let c;
    try {
      c = await drawCard();
    } catch (e) {
      // remboursement
      await dbRun(`UPDATE users SET money = money + $1 WHERE id=$2`, [COST_ONE, req.user.id]);
      return res.status(502).json({ error: "Erreur image (réessaie)" });
    }

    const grade = rollGrade();
    const mint = rollMintForGrade(grade);
    const now = Date.now();

    const idKey = `${c.name}__${c.set}__${c.image}`;

    // pulls log
    await dbRun(
      `INSERT INTO pulls (user_id, name, setname, image, grade, mint, at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, c.name, c.set, c.image, grade, mint, now]
    );

    // upsert collection (Postgres)
    await dbRun(
      `INSERT INTO collection (user_id, idkey, name, setname, image, grade, mint, count, lastat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)
       ON CONFLICT (user_id, idkey)
       DO UPDATE SET
         count = collection.count + 1,
         grade = GREATEST(collection.grade, EXCLUDED.grade),
         mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
         lastat = EXCLUDED.lastat`,
      [req.user.id, idKey, c.name, c.set, c.image, grade, mint, now]
    );

    // renvoie résultat + money actuel
    const me = await dbGet(`SELECT money FROM users WHERE id=$1`, [req.user.id]);

    res.json({
      money: me?.money || 0,
      card: {
        name: c.name,
        set: c.set,
        image: c.image,
        grade,
        mint: Boolean(mint),
      },
    });
  } catch (e) {
    console.error("Open error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Collection
app.get("/api/collection", auth, async (req, res) => {
  try {
    await applyPayForUser(req.user.id);

    const items = await dbAll(
      `SELECT idkey, name, setname, image, grade, mint, count, lastat
       FROM collection
       WHERE user_id=$1
       ORDER BY lastat DESC`,
      [req.user.id]
    );

    const me = await dbGet(`SELECT money FROM users WHERE id=$1`, [req.user.id]);

    res.json({
      money: me?.money || 0,
      items: items.map((x) => ({
        idKey: x.idkey,
        name: x.name,
        set: x.setname,
        image: x.image,
        grade: x.grade,
        mint: Boolean(x.mint),
        count: x.count,
        lastAt: Number(x.lastat),
      })),
    });
  } catch (e) {
    console.error("Collection error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Historique (pulls)
app.get("/api/pulls", auth, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT name, setname, image, grade, mint, at
       FROM pulls
       WHERE user_id=$1
       ORDER BY at DESC
       LIMIT 80`,
      [req.user.id]
    );

    res.json({
      pulls: rows.map((r) => ({
        name: r.name,
        set: r.setname,
        image: r.image,
        grade: r.grade,
        mint: Boolean(r.mint),
        at: Number(r.at),
      })),
    });
  } catch (e) {
    console.error("Pulls error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Vendre (retire 1 exemplaire) => +1💵
app.post("/api/sell", auth, async (req, res) => {
  try {
    const idKey = String(req.body?.idKey || "");
    if (!idKey) return res.status(400).json({ error: "Missing idKey" });

    const item = await dbGet(
      `SELECT count FROM collection WHERE user_id=$1 AND idkey=$2`,
      [req.user.id, idKey]
    );
    if (!item) return res.status(404).json({ error: "Not owned" });

    if (Number(item.count) <= 1) {
      await dbRun(`DELETE FROM collection WHERE user_id=$1 AND idkey=$2`, [req.user.id, idKey]);
    } else {
      await dbRun(
        `UPDATE collection SET count = count - 1 WHERE user_id=$1 AND idkey=$2`,
        [req.user.id, idKey]
      );
    }

    await dbRun(`UPDATE users SET money = money + 1 WHERE id=$1`, [req.user.id]);

    const me = await dbGet(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
    res.json({ ok: true, money: me?.money || 0 });
  } catch (e) {
    console.error("Sell error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// ----- START -----
initDb()
  .then(() => {
    app.listen(PORT, () => console.log("Server listening."));
  })
  .catch((e) => {
    console.error("DB init error:", e);
    process.exit(1);
  });