import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const DB_PATH = path.join(__dirname, "game.db");

// ----- STATIC -----
app.use(express.static(__dirname));
app.use("/data", express.static(path.join(__dirname, "data"), {
  setHeaders(res){ res.setHeader("Cache-Control", "no-store"); }
}));

console.log(`✅ http://localhost:${PORT}`);

// ----- OFFLINE CARDS -----
const OFFLINE_PATH = path.join(__dirname, "data", "cards.json");
let offlineCards = null;

function loadOffline(){
  try{
    if(fs.existsSync(OFFLINE_PATH)){
      const raw = fs.readFileSync(OFFLINE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length){
        offlineCards = parsed;
        console.log(`📦 Offline loaded: ${offlineCards.length} cards`);
      }
    }
  }catch(e){
    console.log("Offline load error:", e.message);
  }
}
loadOffline();

// ----- DB -----
let db;

async function initDb(){
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  await db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      money INTEGER NOT NULL DEFAULT 0,
      lastPay INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection (
      user_id INTEGER NOT NULL,
      idKey TEXT NOT NULL,
      name TEXT NOT NULL,
      setName TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      count INTEGER NOT NULL DEFAULT 1,
      lastAt INTEGER NOT NULL,
      PRIMARY KEY(user_id, idKey)
    );

    CREATE TABLE IF NOT EXISTS pulls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      setName TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      at INTEGER NOT NULL
    );
  `);
    // ---- MIGRATION (si ancienne DB) ----
  const cols = await db.all(`PRAGMA table_info(users)`);
  const names = new Set(cols.map(c => c.name));

  if(!names.has("lastPay")){
    await db.exec(`ALTER TABLE users ADD COLUMN lastPay INTEGER NOT NULL DEFAULT 0;`);
    console.log("🛠️ Migration: users.lastPay ajouté");
  }
  if(!names.has("createdAt")){
    await db.exec(`ALTER TABLE users ADD COLUMN createdAt INTEGER NOT NULL DEFAULT 0;`);
    console.log("🛠️ Migration: users.createdAt ajouté");
  }
  if(!names.has("money")){
    await db.exec(`ALTER TABLE users ADD COLUMN money INTEGER NOT NULL DEFAULT 0;`);
    console.log("🛠️ Migration: users.money ajouté");
  }

  console.log("✅ DB ready:", DB_PATH);
}


function randCode(len = 6){
  return String(Math.floor(Math.random() * Math.pow(10, len))).padStart(len, "0");
}
function randToken(){
  return crypto.randomBytes(24).toString("hex");
}

// ----- PAY LOOP (server-side) -----
const PAY_AMOUNT = 10;
const PAY_EVERY_MS = 5 * 60 * 1000;

async function applyPayForUser(userId){
  const u = await db.get(`SELECT money, lastPay FROM users WHERE id=?`, userId);
  if(!u) return;

  const now = Date.now();
  const last = u.lastPay || now;
  const delta = Math.max(0, now - last);
  const ticks = Math.floor(delta / PAY_EVERY_MS);

  if(ticks > 0){
    const add = ticks * PAY_AMOUNT;
    const newLast = last + ticks * PAY_EVERY_MS;
    await db.run(`UPDATE users SET money = money + ?, lastPay=? WHERE id=?`, add, newLast, userId);
  }
}

// ----- AUTH -----
async function auth(req, res, next){
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1];
  if(!token) return res.status(401).json({ error: "Missing token" });

  const u = await db.get(`SELECT id, name FROM users WHERE token=?`, token);
  if(!u) return res.status(401).json({ error: "Invalid token" });

  req.user = u;
  next();
}

// ----- HTTP fetch with timeout -----
async function fetchWithTimeout(url, ms = 20000){
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try{
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ----- CARD FETCH -----
function normalizeImageUrl(imgUrl){
  if(!imgUrl) return null;

  if(typeof imgUrl === "object"){
    imgUrl = imgUrl.high || imgUrl.large || imgUrl.medium || imgUrl.small || imgUrl.url || null;
  }
  if(typeof imgUrl !== "string") return null;

  const hasExt = /\.(png|jpe?g|webp)(\?|$)/i.test(imgUrl);
  if(!hasExt) imgUrl = imgUrl.replace(/\/$/, "") + "/high.png";

  return imgUrl;
}

async function drawCard(){
  // 1) offline prioritaire
  if(offlineCards?.length){
    const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
    if(c?.image) return c;
  }

  // 2) online retries
  const MAX_TRIES = 6;

  for(let attempt=0; attempt<MAX_TRIES; attempt++){
    const r = await fetchWithTimeout("https://api.tcgdex.net/v2/fr/cards", 20000);
    if(!r.ok) continue;

    const cards = await r.json().catch(()=>null);
    if(!Array.isArray(cards) || cards.length === 0) continue;

    const pick = cards[Math.floor(Math.random() * cards.length)];
    if(!pick?.id) continue;

    const r2 = await fetchWithTimeout(`https://api.tcgdex.net/v2/fr/cards/${pick.id}`, 20000);
    if(!r2.ok) continue;

    const c = await r2.json().catch(()=>null);
    if(!c) continue;

    const img = normalizeImageUrl(c.image);
    if(!img) continue;

    return {
      name: c.name || pick.name || "Unknown",
      set: (c.set && (c.set.name || c.set.id)) || "Unknown",
      rarity: c.rarity || "",
      image: img
    };
  }

  // 3) dernière chance offline
  if(offlineCards?.length){
    const c = offlineCards[Math.floor(Math.random() * offlineCards.length)];
    if(c?.image) return c;
  }

  throw new Error("No image (TCGdex)");
}

// ----- GRADES -----
function rollGrade(){
  // même distribution que tu avais (modifiable)
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

function rollMintForGrade(grade){
  if(grade !== 10) return 0;
  return (Math.random() < (1/3)) ? 1 : 0;
}

const COST_ONE = 5;

// ----- ROUTES -----

// Login: pseudo + code (optionnel)
app.post("/api/login", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const code = String(req.body?.code || "").trim();

  if(!name) return res.status(400).json({ error: "Pseudo requis" });

  const now = Date.now();

  const existing = await db.get(`SELECT id, code, token FROM users WHERE name=?`, name);

  // Nouveau compte
  if(!existing){
    const newCode = randCode(6);
    const token = randToken();

    await db.run(
      `INSERT INTO users (name, code, token, money, lastPay, createdAt)
       VALUES (?, ?, ?, 0, ?, ?)`,
      name, newCode, token, now, now
    );

    return res.json({ token, isNew: true, code: newCode });
  }

  // Compte existant -> code obligatoire
  if(!code || code !== existing.code){
    return res.status(401).json({ error: "Code incorrect" });
  }

  return res.json({ token: existing.token, isNew: false });
});

// Infos money (utile si tu veux)
app.get("/api/me", auth, async (req, res) => {
  await applyPayForUser(req.user.id);
  const u = await db.get(`SELECT name, money FROM users WHERE id=?`, req.user.id);
  res.json({ name: u?.name, money: u?.money || 0 });
});

// Tirage
app.post("/api/open", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const u = await db.get(`SELECT money FROM users WHERE id=?`, req.user.id);
  const money = u?.money ?? 0;

  if(money < COST_ONE){
    return res.status(400).json({ error: "Pas assez de Pokédollars" });
  }

  // spend
  await db.run(`UPDATE users SET money = money - ? WHERE id=?`, COST_ONE, req.user.id);

  // drawCard safe
  let c;
  try{
    c = await drawCard();
  }catch(e){
    // remboursement
    await db.run(`UPDATE users SET money = money + ? WHERE id=?`, COST_ONE, req.user.id);
    return res.status(502).json({ error: "Erreur image (réessaie)" });
  }

  const grade = rollGrade();
  const mint = rollMintForGrade(grade);
  const now = Date.now();

  const idKey = `${c.name}__${c.set}__${c.image}`;

  // pulls log
  await db.run(
    `INSERT INTO pulls (user_id, name, setName, image, grade, mint, at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    req.user.id, c.name, c.set, c.image, grade, mint, now
  );

  // upsert collection
  const existing = await db.get(
    `SELECT count, grade, mint FROM collection WHERE user_id=? AND idKey=?`,
    req.user.id, idKey
  );

  if(existing){
    await db.run(
      `UPDATE collection
       SET count = count + 1,
           grade = CASE WHEN ? > grade THEN ? ELSE grade END,
           mint  = CASE WHEN mint = 1 OR ? = 1 THEN 1 ELSE 0 END,
           lastAt = ?
       WHERE user_id=? AND idKey=?`,
      grade, grade, mint, now, req.user.id, idKey
    );
  } else {
    await db.run(
      `INSERT INTO collection (user_id, idKey, name, setName, image, grade, mint, count, lastAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      req.user.id, idKey, c.name, c.set, c.image, grade, mint, now
    );
  }

  // renvoie résultat + money actuel
  const me = await db.get(`SELECT money FROM users WHERE id=?`, req.user.id);

  res.json({
    money: me?.money || 0,
    card: {
      name: c.name,
      set: c.set,
      image: c.image,
      grade,
      mint: Boolean(mint)
    }
  });
});

// Collection
app.get("/api/collection", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const items = await db.all(
    `SELECT idKey, name, setName, image, grade, mint, count, lastAt
     FROM collection
     WHERE user_id=?
     ORDER BY lastAt DESC`,
    req.user.id
  );

  const me = await db.get(`SELECT money FROM users WHERE id=?`, req.user.id);

  res.json({
    money: me?.money || 0,
    items: items.map(x => ({
      idKey: x.idKey,
      name: x.name,
      set: x.setName,          // ✅ JSON "set"
      image: x.image,
      grade: x.grade,
      mint: Boolean(x.mint),
      count: x.count,
      lastAt: x.lastAt
    }))
  });
});

// Historique (pulls)
app.get("/api/pulls", auth, async (req, res) => {
  const rows = await db.all(
    `SELECT name, setName, image, grade, mint, at
     FROM pulls
     WHERE user_id=?
     ORDER BY at DESC
     LIMIT 80`,
    req.user.id
  );

  res.json({
    pulls: rows.map(r => ({
      name: r.name,
      set: r.setName,          // ✅ JSON "set"
      image: r.image,
      grade: r.grade,
      mint: Boolean(r.mint),
      at: r.at
    }))
  });
});

// Vendre (retire 1 exemplaire) => +1💵
app.post("/api/sell", auth, async (req, res) => {
  const idKey = String(req.body?.idKey || "");
  if(!idKey) return res.status(400).json({ error: "Missing idKey" });

  const item = await db.get(
    `SELECT count FROM collection WHERE user_id=? AND idKey=?`,
    req.user.id, idKey
  );
  if(!item) return res.status(404).json({ error: "Not owned" });

  if(item.count <= 1){
    await db.run(`DELETE FROM collection WHERE user_id=? AND idKey=?`, req.user.id, idKey);
  }else{
    await db.run(
      `UPDATE collection SET count = count - 1 WHERE user_id=? AND idKey=?`,
      req.user.id, idKey
    );
  }

  await db.run(`UPDATE users SET money = money + 1 WHERE id=?`, req.user.id);

  const me = await db.get(`SELECT money FROM users WHERE id=?`, req.user.id);
  res.json({ ok:true, money: me?.money || 0 });
});

// ----- START -----
initDb().then(() => {
  app.listen(PORT, () => console.log("Server listening."));
}).catch((e) => {
  console.error("DB init error:", e);
  process.exit(1);
});