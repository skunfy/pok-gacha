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

//OFFLINE DRAGON BALL //

const OFFLINE_DRAGONBALL_DIR = path.join(__dirname, "data", "dragonball");
const OFFLINE_DRAGONBALL_CARDS_PATH = path.join(OFFLINE_DRAGONBALL_DIR, "cards.json");
const OFFLINE_DRAGONBALL_SETS_PATH = path.join(OFFLINE_DRAGONBALL_DIR, "sets.json");

let offlineDragonballCards = [];
let offlineDragonballSets = [];
const offlineDragonballCardsBySet = new Map();

function loadOfflineDragonball() {
  try {
    offlineDragonballCards = [];
    offlineDragonballSets = [];
    offlineDragonballCardsBySet.clear();

    if (fs.existsSync(OFFLINE_DRAGONBALL_CARDS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_DRAGONBALL_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlineDragonballCards = parsed;
      }
    } else {
      console.log("📦 No offline Dragon Ball cards.json found at", OFFLINE_DRAGONBALL_CARDS_PATH);
    }

    if (fs.existsSync(OFFLINE_DRAGONBALL_SETS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_DRAGONBALL_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlineDragonballSets = parsed;
      }
    } else {
      console.log("📦 No offline Dragon Ball sets.json found at", OFFLINE_DRAGONBALL_SETS_PATH);
    }

    for (const c of offlineDragonballCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;
      if (!offlineDragonballCardsBySet.has(setId)) {
        offlineDragonballCardsBySet.set(setId, []);
      }
      offlineDragonballCardsBySet.get(setId).push(c);
    }

    console.log(`📦 Offline Dragon Ball sets: ${offlineDragonballSets.length}`);
    console.log(`📦 Offline Dragon Ball cards: ${offlineDragonballCards.length}`);
  } catch (e) {
    console.log("Offline Dragon Ball load error:", e.message);
  }
}
loadOfflineDragonball();


function drawOfflineDragonballCard() {
  if (!offlineDragonballCards?.length) {
    throw new Error("Offline Dragon Ball pool empty");
  }

  return offlineDragonballCards[
    Math.floor(Math.random() * offlineDragonballCards.length)
  ];
}

// OFFLINE UNION ARENA //

const OFFLINE_UNIONARENA_DIR = path.join(__dirname, "data", "unionarena");
const OFFLINE_UNIONARENA_CARDS_PATH = path.join(OFFLINE_UNIONARENA_DIR, "cards.json");
const OFFLINE_UNIONARENA_SETS_PATH = path.join(OFFLINE_UNIONARENA_DIR, "sets.json");

let offlineUnionArenaCards = [];
let offlineUnionArenaSets = [];
const offlineUnionArenaCardsBySet = new Map();

function loadOfflineUnionArena() {
  try {
    offlineUnionArenaCards = [];
    offlineUnionArenaSets = [];
    offlineUnionArenaCardsBySet.clear();

    if (fs.existsSync(OFFLINE_UNIONARENA_CARDS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_UNIONARENA_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlineUnionArenaCards = parsed;
      }
    } else {
      console.log("📦 No offline Union Arena cards.json found at", OFFLINE_UNIONARENA_CARDS_PATH);
    }

    if (fs.existsSync(OFFLINE_UNIONARENA_SETS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_UNIONARENA_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlineUnionArenaSets = parsed;
      }
    } else {
      console.log("📦 No offline Union Arena sets.json found at", OFFLINE_UNIONARENA_SETS_PATH);
    }

    for (const c of offlineUnionArenaCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;

      if (!offlineUnionArenaCardsBySet.has(setId)) {
        offlineUnionArenaCardsBySet.set(setId, []);
      }
      offlineUnionArenaCardsBySet.get(setId).push(c);
    }

    console.log(`📦 Offline Union Arena sets: ${offlineUnionArenaSets.length}`);
    console.log(`📦 Offline Union Arena cards: ${offlineUnionArenaCards.length}`);
  } catch (e) {
    console.log("Offline Union Arena load error:", e.message);
  }
}
loadOfflineUnionArena();

function isValidUnionArenaImage(url) {
  const u = String(url || "").trim().toLowerCase();
  if (!u) return false;
  if (u.includes("dummy.gif")) return false;
  return true;
}

function drawOfflineUnionArenaCard() {
  if (!offlineUnionArenaCards?.length) {
    throw new Error("Offline Union Arena pool empty");
  }

  const valid = offlineUnionArenaCards.filter(c =>
    isValidUnionArenaImage(c?.image) || isValidUnionArenaImage(c?.imageHigh)
  );

  if (!valid.length) {
    throw new Error("Offline Union Arena has no valid images");
  }

  return valid[Math.floor(Math.random() * valid.length)];
}
// =========================
// OFFLINE SENPAI GODDESS HAVEN
// =========================
const OFFLINE_SENPAI_DIR = path.join(__dirname, "data", "senpai-goddess-haven");
const OFFLINE_SENPAI_CARDS_PATH = path.join(OFFLINE_SENPAI_DIR, "cards.json");
const OFFLINE_SENPAI_SETS_PATH = path.join(OFFLINE_SENPAI_DIR, "sets.json");

let offlineSenpaiCards = [];
let offlineSenpaiSets = [];
const offlineSenpaiCardsBySet = new Map();

function loadOfflineSenpai() {
  try {
    offlineSenpaiCards = [];
    offlineSenpaiSets = [];
    offlineSenpaiCardsBySet.clear();

    if (fs.existsSync(OFFLINE_SENPAI_CARDS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_SENPAI_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlineSenpaiCards = parsed;
      }
    } else {
      console.log("📦 No offline Senpai Goddess Haven cards.json found at", OFFLINE_SENPAI_CARDS_PATH);
    }

    if (fs.existsSync(OFFLINE_SENPAI_SETS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_SENPAI_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlineSenpaiSets = parsed;
      }
    } else {
      console.log("📦 No offline Senpai Goddess Haven sets.json found at", OFFLINE_SENPAI_SETS_PATH);
    }

    for (const c of offlineSenpaiCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;
      if (!offlineSenpaiCardsBySet.has(setId)) {
        offlineSenpaiCardsBySet.set(setId, []);
      }
      offlineSenpaiCardsBySet.get(setId).push(c);
    }

    console.log(`📦 Offline Senpai Goddess Haven sets: ${offlineSenpaiSets.length}`);
    console.log(`📦 Offline Senpai Goddess Haven cards: ${offlineSenpaiCards.length}`);
  } catch (e) {
    console.log("Offline Senpai Goddess Haven load error:", e.message);
  }
}
loadOfflineSenpai();

function drawOfflineSenpaiCard() {
  if (!offlineSenpaiCards?.length) {
    throw new Error("Offline Senpai Goddess Haven pool empty");
  }
  const valid = offlineSenpaiCards.filter(c => c?.image);
  if (!valid.length) throw new Error("Senpai Goddess Haven: no valid images");
  return valid[Math.floor(Math.random() * valid.length)];
}

// =========================
// OFFLINE POKEMON CATALOG
// =========================
const FORCE_OFFLINE = process.env.FORCE_OFFLINE === "1";

const OFFLINE_POKEMON_DIR = path.join(__dirname, "data", "pokemon");
const OFFLINE_POKEMON_CARDS_PATH = path.join(OFFLINE_POKEMON_DIR, "cards.json");
const OFFLINE_POKEMON_SETS_PATH = path.join(OFFLINE_POKEMON_DIR, "sets.json");

let offlinePokemonCards = [];
let offlinePokemonSets = [];
const offlinePokemonCardsBySet = new Map();

function loadOfflinePokemon() {
  try {
    offlinePokemonCards = [];
    offlinePokemonSets = [];
    offlinePokemonCardsBySet.clear();

    if (fs.existsSync(OFFLINE_POKEMON_CARDS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_POKEMON_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlinePokemonCards = parsed;
      }
    } else {
      console.log("📦 No offline Pokémon cards.json found at", OFFLINE_POKEMON_CARDS_PATH);
    }

    if (fs.existsSync(OFFLINE_POKEMON_SETS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_POKEMON_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        offlinePokemonSets = parsed;
      }
    } else {
      console.log("📦 No offline Pokémon sets.json found at", OFFLINE_POKEMON_SETS_PATH);
    }

    for (const c of offlinePokemonCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;
      if (!offlinePokemonCardsBySet.has(setId)) {
        offlinePokemonCardsBySet.set(setId, []);
      }
      offlinePokemonCardsBySet.get(setId).push(c);
    }

    console.log(`📦 Offline Pokémon sets: ${offlinePokemonSets.length}`);
    console.log(`📦 Offline Pokémon cards: ${offlinePokemonCards.length}`);
  } catch (e) {
    console.log("Offline Pokémon load error:", e.message);
  }
}
loadOfflinePokemon();

console.log(`🧩 FORCE_OFFLINE=${FORCE_OFFLINE ? "ON" : "OFF"}`);
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

  // =========================
  // TABLES DE BASE
  // =========================
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
      game TEXT, -- ✅ présent sur DB neuve
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
      game TEXT, -- ✅ présent sur DB neuve
      name TEXT NOT NULL,
      setName TEXT NOT NULL,
      image TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mint INTEGER NOT NULL DEFAULT 0,
      at BIGINT NOT NULL
    );
  `);

  // =========================
  // COLONNES PROFIL (SAFE)
  // =========================
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS banner TEXT;
  `);

  // =========================
  // XP (SAFE, une seule fois)
  // =========================
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS xp BIGINT;
  `);
  await pool.query(`UPDATE users SET xp = 0 WHERE xp IS NULL;`);
  await pool.query(`ALTER TABLE users ALTER COLUMN xp SET DEFAULT 0;`);
  await pool.query(`ALTER TABLE users ALTER COLUMN xp SET NOT NULL;`);

  // =========================
  // FRIENDS
  // =========================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS friends (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      createdAt BIGINT NOT NULL,
      PRIMARY KEY(user_id, friend_user_id)
    );
  `);

  // =========================
  // MARKET
  // =========================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS market_listings (
      id SERIAL PRIMARY KEY,
      seller_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      idKey TEXT NOT NULL,
      game TEXT, -- ✅ présent sur DB neuve
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

  // =========================
  // NOTIFICATIONS
  // =========================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      meta JSONB,
      is_read INTEGER NOT NULL DEFAULT 0,
      createdAt BIGINT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_time
    ON notifications(user_id, createdAt DESC);

    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, is_read);
  `);

  // =========================
  // FAVORITES
  // =========================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      idKey TEXT NOT NULL,
      createdAt BIGINT NOT NULL,
      PRIMARY KEY(user_id, idKey)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user
    ON favorites(user_id);
  `);

  // =========================
  // MIGRATION SAFE: game column (DB déjà existante)
  // =========================
  await pool.query(`ALTER TABLE collection ADD COLUMN IF NOT EXISTS game TEXT;`);
  await pool.query(`ALTER TABLE pulls ADD COLUMN IF NOT EXISTS game TEXT;`);
  await pool.query(`ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS game TEXT;`);

  // défaut pour l'existant
  await pool.query(`UPDATE collection SET game='pokemon' WHERE game IS NULL;`);
  await pool.query(`UPDATE pulls SET game='pokemon' WHERE game IS NULL;`);
  await pool.query(`UPDATE market_listings SET game='pokemon' WHERE game IS NULL;`);

  // ✅ imageHigh (zoom HD)
  await pool.query(`ALTER TABLE pulls ADD COLUMN IF NOT EXISTS imageHigh TEXT;`);
  await pool.query(`ALTER TABLE collection ADD COLUMN IF NOT EXISTS imageHigh TEXT;`);
  await pool.query(`ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS imageHigh TEXT;`);

    // ✅ Binder fields (MARKET)
  await pool.query(`ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS cardId TEXT;`);
  await pool.query(`ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS setId TEXT;`);
  await pool.query(`ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS localId TEXT;`);


    // ✅ Binder fields (Pokémon)
  await pool.query(`ALTER TABLE collection ADD COLUMN IF NOT EXISTS cardId TEXT;`);
  await pool.query(`ALTER TABLE collection ADD COLUMN IF NOT EXISTS setId TEXT;`);
  await pool.query(`ALTER TABLE collection ADD COLUMN IF NOT EXISTS localId TEXT;`);

  await pool.query(`ALTER TABLE pulls ADD COLUMN IF NOT EXISTS cardId TEXT;`);
  await pool.query(`ALTER TABLE pulls ADD COLUMN IF NOT EXISTS setId TEXT;`);
  await pool.query(`ALTER TABLE pulls ADD COLUMN IF NOT EXISTS localId TEXT;`);

  // =========================
  // TICKETS & DOLLAX
  // =========================
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tickets INTEGER NOT NULL DEFAULT 0;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastTicketPay BIGINT NOT NULL DEFAULT 0;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dollax BIGINT NOT NULL DEFAULT 0;`);
  // Donner 10 tickets de départ aux anciens comptes qui n'en ont pas encore
  // Donner 10 tickets de départ et initialiser le timer pour les nouveaux comptes
  await pool.query(`UPDATE users SET tickets = 10, lastTicketPay = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 WHERE tickets = 0 AND lastTicketPay = 0;`);
  // Initialiser lastTicketPay pour les comptes qui ont des tickets mais pas de timer
  await pool.query(`UPDATE users SET lastTicketPay = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000 WHERE lastTicketPay = 0;`);

  console.log("✅ Postgres DB ready");
}
  

// =========================
// HELPERS
// =========================
  
  async function fetchJson(url){
    const r = await fetch(url);
    if(!r.ok) return null;
    return await r.json().catch(()=> null);
  }

  async function getTcgDexCardsListFRorEN(){
    const fr = await fetchJson("https://api.tcgdex.net/v2/fr/cards");
    if(Array.isArray(fr) && fr.length) return { lang:"fr", list: fr };

    const en = await fetchJson("https://api.tcgdex.net/v2/en/cards");
    if(Array.isArray(en) && en.length) return { lang:"en", list: en };

    return { lang:"", list: [] };
  }

  async function getTcgDexCardDetailFRorEN(id){
    const fr = await fetchJson(`https://api.tcgdex.net/v2/fr/cards/${encodeURIComponent(id)}`);
    if(fr && fr.id) return { lang:"fr", card: fr };

    const en = await fetchJson(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(id)}`);
    if(en && en.id) return { lang:"en", card: en };

    return { lang:"", card: null };
  }



function randCode(len = 6) {
  return String(Math.floor(Math.random() * Math.pow(10, len))).padStart(len, "0");
}

function randToken() {
  return crypto.randomBytes(24).toString("hex");
}

function drawOfflinePokemonCard() {
  if (!offlinePokemonCards?.length) {
    throw new Error("Offline Pokémon pool empty");
  }

  return offlinePokemonCards[
    Math.floor(Math.random() * offlinePokemonCards.length)
  ];
}

function randFriendCode() {
  const s = crypto.randomBytes(4).toString("hex").toUpperCase();
  return s.slice(0, 4) + "-" + s.slice(4, 8);
}

function sellPriceFor(grade, mint){
  if (mint) return 20;
  const g = Number(grade) || 0;
  if (g >= 10) return 10;
  if (g >= 7) return 3;
  if (g >= 5) return 2;
  return 1;
}

async function notify(userId, type, title, body, meta = null) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, meta, is_read, createdAt)
     VALUES ($1,$2,$3,$4,$5,0,$6)`,
    [userId, type, title, body, meta ? JSON.stringify(meta) : null, Date.now()]
  );
}

function getGame(req){
  const g = String(req.query.game || "pokemon").toLowerCase();
  if (g === "onepiece") return "onepiece";
  if (g === "lorcana") return "lorcana";
  if (g === "dragonball") return "dragonball";
  if (g === "unionarena") return "unionarena";
  if (g === "senpaigodesshaven") return "senpaigodesshaven";
  return "pokemon";
}

function parseIdKeyServer(idKey){
  const p = String(idKey || "").split("__");
  return {
    game:    p[0] || "",
    setId:   p[1] || "",
    localId: p[2] || "",
    cardId:  p[3] || ""
  };
}

function levelForXp(xp){
  const x = Math.max(0, Number(xp) || 0);
  // courbe simple: lvl 1 -> 0 xp, lvl 2 -> 100 xp, lvl 3 -> 300 xp, etc.
  // (100 * (lvl-1)^2)
  return Math.floor(Math.sqrt(x / 100)) + 1;
}

function xpForOpen(grade){
  if (grade === 10) return 100;
  if (grade >= 8) return 50;
  if (grade >= 5) return 25;
  return 10;
}


function xpForSell(unitPrice, qty){
  // logique simple: tu gagnes autant d'XP que d'argent (ou *2 si tu veux)
  return Math.max(1, (Number(unitPrice) || 1) * (Number(qty) || 1));
}

async function imageUrlWorks(url) {
  if (!url) return false;
  try {
    const r = await fetchWithTimeout(url, 2000);
    return r.ok;
  } catch {
    return false;
  }
}

function uniqueStrings(arr) {
  return [...new Set(arr.map(x => String(x || "").trim()).filter(Boolean))];
}

 function getTcgdexSerieCandidates(setId, card = null) {
  const s = String(setId || "").trim().toLowerCase();
  if (!s) return [];

  const fromCardSerie =
    card?.set?.serie?.id ||
    card?.set?.serieId ||
    card?.set?.serie ||
    null;

  const specialMap = {
    basep: "base",
    bwp: "bw",
    xyp: "xy",
    smp: "sm",
    swshp: "swsh",
    svp: "sv",
    hgssp: "hgss",
    np: "bw",
    dvp: "dp",
  };

  const strippedTrailingDigits = s.replace(/[0-9]+$/g, "");
  const strippedLeadingDigits  = s.replace(/^[0-9]+/g, "");

  const inferredByPrefix =
    s.startsWith("dp")   ? "dp" :
    s.startsWith("pl")   ? "pl" :
    s.startsWith("hgss") ? "hgss" :
    s.startsWith("bw")   ? "bw" :
    s.startsWith("xy")   ? "xy" :
    s.startsWith("sm")   ? "sm" :
    s.startsWith("swsh") ? "swsh" :
    s.startsWith("sv")   ? "sv" :
    s.startsWith("ex")   ? "ex" :
    s.startsWith("neo")  ? "neo" :
    s.startsWith("base") ? "base" :
    null;

  return [...new Set([
    fromCardSerie,
    specialMap[s],
    inferredByPrefix,
    strippedTrailingDigits,
    strippedLeadingDigits,
    s
  ].map(x => String(x || "").trim()).filter(Boolean))];
}

const tcgdexImageCache = new Map();

async function firstWorkingTcgdexImages(setId, localId, card = null) {
  const key = `${String(setId || "").trim()}__${String(localId || "").trim()}`;
  if (!setId || !localId) return null;

  if (tcgdexImageCache.has(key)) {
    return tcgdexImageCache.get(key);
  }

  const langs = ["fr", "en"];
  const series = getTcgdexSerieCandidates(setId, card);

  for (const lang of langs) {
    for (const serie of series) {
      const low = `https://assets.tcgdex.net/${lang}/${serie}/${setId}/${localId}/low.webp`;
      const high = `https://assets.tcgdex.net/${lang}/${serie}/${setId}/${localId}/high.webp`;

      try {
        const r = await fetchWithTimeout(low, 2500);
        if (r.ok) {
          const found = { image: low, imageHigh: high, lang, serie };
          tcgdexImageCache.set(key, found);
          return found;
        }
      } catch {}
    }
  }

  tcgdexImageCache.set(key, null);
  return null;
}

// ----- PAY LOOP (server-side) -----
const PAY_AMOUNT = 10;
const PAY_EVERY_MS = 15 * 60 * 1000;

// ----- TICKETS -----
const TICKET_AMOUNT   = 1;
const TICKET_EVERY_MS = 2 * 60 * 60 * 1000; // 1 ticket toutes les 2h
const TICKET_CAP      = 50;                  // max 50 tickets stockés

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

// ----- TICKET LOOP (server-side) -----
async function applyTicketsForUser(userId) {
  const { rows } = await pool.query(`SELECT tickets, lastTicketPay FROM users WHERE id=$1`, [userId]);
  const u = rows[0];
  if (!u) return;

  const now     = Date.now();
  const tickets = Number(u.tickets || 0);
  if (tickets >= TICKET_CAP) return; // déjà au max

  const last = Number(u.lastticketpay ?? u.lastTicketPay ?? 0);

  // Si lastTicketPay n'a jamais été initialisé, on l'initialise à now
  // sans donner de tickets (le compteur démarre maintenant)
  if (last === 0) {
    await pool.query(`UPDATE users SET lastTicketPay=$1 WHERE id=$2`, [now, userId]);
    return;
  }

  const delta = Math.max(0, now - last);
  const ticks = Math.floor(delta / TICKET_EVERY_MS);

  if (ticks > 0) {
    const add     = Math.min(ticks * TICKET_AMOUNT, TICKET_CAP - tickets);
    const newLast = last + ticks * TICKET_EVERY_MS;
    await pool.query(
      `UPDATE users SET tickets = LEAST(tickets + $1, $2), lastTicketPay=$3 WHERE id=$4`,
      [add, TICKET_CAP, newLast, userId]
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
// BINDER CACHE (SETS + SET_CARDS)
// =========================
 // =========================
// BINDER CACHE (SETS + SET_CARDS)
// =========================
const SETS_TTL_MS = 6 * 60 * 60 * 1000;      // 6h
const SET_CARDS_TTL_MS = 6 * 60 * 60 * 1000; // 6h

let setsCache = { at: 0, list: [] };     // cache liste des sets
const setCardsCache = new Map();         // setId -> { at, cards }

async function getPokemonSetsCached() {
  const now = Date.now();
  if (setsCache.list.length && now - setsCache.at < SETS_TTL_MS) {
    return setsCache.list;
  }

  const r = await fetchWithTimeout("https://api.tcgdex.net/v2/fr/sets", 20000);
  if (!r.ok) throw new Error("TCGdex sets failed");

  const list = await r.json().catch(() => []);
  const clean = Array.isArray(list) ? list : [];

  setsCache = { at: now, list: clean };
  return clean;
}

async function getPokemonSetCardsCached(setId) {
  const now = Date.now();
  const cached = setCardsCache.get(setId);

  if (cached?.cards?.length && now - cached.at < SET_CARDS_TTL_MS) {
    return cached.cards;
  }

  async function fetchSet(lang) {
    const r = await fetchWithTimeout(
      `https://api.tcgdex.net/v2/${lang}/sets/${encodeURIComponent(setId)}`,
      20000
    );
    if (!r.ok) return null;

    const data = await r.json().catch(() => null);
    const cards = Array.isArray(data?.cards) ? data.cards : [];
    if (!cards.length) return null;

    return {
      lang,
      serieId: data?.serie?.id || null,
      cards
    };
  }

  let result = await fetchSet("fr");
  if (!result) result = await fetchSet("en");

  const safe = result || { lang: "fr", serieId: null, cards: [] };

  setCardsCache.set(setId, { at: now, cards: safe });
  return safe;
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

async function getCardDetailById(id, preferredLang = "fr") {
  const now = Date.now();
  const key = `${preferredLang}:${id}`;
  const cached = cardDetailCache.get(key);
  if (cached && now - cached.at < CARD_DETAIL_TTL_MS) return cached.data;

  async function fetchCard(lang) {
    const r = await fetchWithTimeout(`https://api.tcgdex.net/v2/${lang}/cards/${encodeURIComponent(id)}`, 20000);
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  }

  // ✅ try preferred lang, then english
  let data = await fetchCard(preferredLang);
  if (!data) data = await fetchCard("en");

  if (!data) throw new Error("TCGdex detail failed");

  cardDetailCache.set(key, { at: now, data });
  return data;
}

// =========================
// LORCANA (LORCAST) ONLINE CACHE
// =========================
const LORCANA_BASE = "https://api.lorcast.com/v0"; // docs: Lorcast API :contentReference[oaicite:1]{index=1}
const LORCANA_SETS_TTL_MS  = 6 * 60 * 60 * 1000;   // 6h
const LORCANA_CARDS_TTL_MS = 6 * 60 * 60 * 1000;   // 6h (par set)

let lorSetsCache = { at: 0, list: [] };
const lorSetCardsCache = new Map(); // code -> {at, list}

async function getLorcanaSets(){
  const now = Date.now();
  if (lorSetsCache.list.length && now - lorSetsCache.at < LORCANA_SETS_TTL_MS) {
    return lorSetsCache.list;
  }

  const r = await fetchWithTimeout(`${LORCANA_BASE}/sets`, 20000);
  if (!r.ok) throw new Error(`LORCAST sets failed HTTP ${r.status}`);

  const data = await r.json().catch(()=> null);

  // ✅ /sets -> { results: [...] }
  const list = Array.isArray(data) ? data : (data?.results || []);
  if (!Array.isArray(list) || !list.length) throw new Error("LORCAST sets empty");

  lorSetsCache = { at: now, list };
  console.log(`🌐 cached Lorcana sets: ${list.length}`);
  return list;
}

async function getLorcanaCardsForSet(code){
  const now = Date.now();
  const cached = lorSetCardsCache.get(code);
  if (cached?.list?.length && now - cached.at < LORCANA_CARDS_TTL_MS) return cached.list;

  const r = await fetchWithTimeout(`${LORCANA_BASE}/sets/${encodeURIComponent(code)}/cards`, 20000);
  if (!r.ok) throw new Error("LORCAST set cards failed HTTP " + r.status);

  const json = await r.json().catch(()=> null);
  const list = Array.isArray(json) ? json : (json?.data || json?.cards || []);
  if (!Array.isArray(list) || !list.length) throw new Error("LORCAST set cards empty");

  lorSetCardsCache.set(code, { at: now, list });
  return list;
}

function pickImageLorcana(card){
  const u = card?.image_uris?.digital || card?.image_uris || null;

  // ✅ on évite "small" comme image principale (souvent trop petite)
  const low  = u?.normal || u?.large || u?.small || null;
  const high = u?.large  || u?.normal || u?.small || null;

  return { low, high };
}

// =========================
// ONE PIECE (OPTCG) ONLINE CACHE
// =========================
const OP_LIST_TTL_MS = 6 * 60 * 60 * 1000;      // 6h
const OP_DETAIL_TTL_MS = 24 * 60 * 60 * 1000;   // 24h

let opBriefCache = { at: 0, list: [] };
const opDetailCache = new Map();

async function getOpBriefList() {
  const now = Date.now();
  if (opBriefCache.list.length && now - opBriefCache.at < OP_LIST_TTL_MS) {
    return opBriefCache.list;
  }

  const r = await fetchWithTimeout("https://optcgapi.com/api/allSetCards/", 20000);
  if (!r.ok) throw new Error("OPTCG list failed");

  const list = await r.json().catch(() => null);
  if (!Array.isArray(list) || !list.length) throw new Error("OPTCG list empty");

  opBriefCache = { at: now, list };
  console.log(`🌐 cached One Piece list: ${list.length} cards`);
  return list;
}

async function getOpCardDetail(cardId) {
  const now = Date.now();
  const cached = opDetailCache.get(cardId);
  if (cached && now - cached.at < OP_DETAIL_TTL_MS) return cached.data;

  const r = await fetchWithTimeout(
    `https://optcgapi.com/api/sets/card/${encodeURIComponent(cardId)}/`,
    20000
  );
  if (!r.ok) throw new Error("OPTCG detail failed");

  const data = await r.json().catch(() => null);
  if (!data) throw new Error("OPTCG detail invalid");

  // ✅ l’API renvoie souvent un ARRAY -> on prend une variante (random)
  const picked = Array.isArray(data)
    ? (data[Math.floor(Math.random() * data.length)] || data[0])
    : data;

  opDetailCache.set(cardId, { at: now, data: picked });
  return picked;
}

// Essayez plusieurs clés possibles (API peut varier selon les cartes)
function pickFirst(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

// =========================
// IMAGE URL NORMALIZATION
// low.webp pour afficher vite, high.webp pour zoom
// =========================
function buildTcgdexAsset(urlBaseOrWithExt, quality = "low", ext = "webp") {
  if (!urlBaseOrWithExt || typeof urlBaseOrWithExt !== "string") return null;

  const u = urlBaseOrWithExt.replace(/\/$/, "");

  if (/\.(png|jpe?g|webp)(\?|$)/i.test(u)) return u;
  if (/(\/low|\/high)$/i.test(u)) return `${u}.${ext}`;

  return `${u}/${quality}.${ext}`;
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

function tcgdexAssetUrl(lang, setId, localId, quality = "low", ext = "webp") {
  if (!setId || !localId) return null;

  let serie;

  // cas spéciaux
  if (setId === "basep") serie = "base";
  else serie = setId.replace(/[0-9]+$/, "");

  return `https://assets.tcgdex.net/${lang}/${serie}/${setId}/${localId}/${quality}.${ext}`;
}

// =========================
// DRAW CARD
// =========================
// =========================
// DRAW CARD (MULTI GAME)
// =========================
async function drawCard(game) {

  // ----- ONE PIECE ONLINE -----
  if (game === "onepiece") {
    const list = await getOpBriefList();

    // On tente plusieurs fois de trouver une carte valide avec image
    for (let attempt = 0; attempt < 10; attempt++) {
      const pick = list[Math.floor(Math.random() * list.length)] || {};

      const cardId =
        pickFirst(pick, ["card_set_id", "cardSetId", "card_id", "cardId", "id"]) ||
        null;

      if (!cardId) continue;

      let d;
      try {
        d = await getOpCardDetail(cardId); // déjà array-safe
      } catch {
        continue;
      }

      const image =
        pickFirst(d, ["card_image", "image_url", "imageUrl", "image", "img"]) ||
        pickFirst(pick, ["card_image", "image_url", "imageUrl", "image", "img"]);

      const name =
        pickFirst(d, ["card_name", "name", "cardName", "title"]) ||
        pickFirst(pick, ["card_name", "name", "cardName", "title"]) ||
        "Unknown";

      const setName =
        pickFirst(d, ["set_name", "setName", "set", "series"]) ||
        pickFirst(pick, ["set_name", "setName", "set", "series"]) ||
        "One Piece";

      if (!image) continue;

      // ✅ binder-friendly ids (setId / localId)
      const setId =
        pickFirst(d, ["set_id", "setId", "set_code", "setCode"]) ||
        pickFirst(pick, ["set_id", "setId", "set_code", "setCode"]) ||
        setName ||
        "onepiece";

      const localId =
        pickFirst(d, ["card_number", "number", "localId", "local_id"]) ||
        pickFirst(pick, ["card_number", "number", "localId", "local_id"]) ||
        "";

      console.log("🌐 source=OPTCG (working)");

      return {
        cardId,                      // ✅
        setId,                       // ✅
        localId: String(localId || ""), // ✅
        name,
        set: setName,
        rarity: pickFirst(d, ["rarity"]) || "",
        image,
        imageHigh: image
      };
    }

    throw new Error("One Piece: impossible de trouver une carte avec image");
  }
  

  // ----- LORCANA ONLINE (LORCAST) -----
if (game === "lorcana") {
  // ✅ IMPORTANT: on récupère les sets UNE seule fois (pas de shadow "const sets" dans le loop)
  const sets = await getLorcanaSets();

  // On tente plusieurs sets si jamais une réponse est vide
  for (let attempt = 0; attempt < 8; attempt++) {
    const s = sets[Math.floor(Math.random() * sets.length)] || {};

    const setCode =
      pickFirst(s, ["code", "set_code", "setCode", "id"]) ||
      null;

    if (!setCode) continue;

    let cards;
    try {
      cards = await getLorcanaCardsForSet(setCode);
    } catch {
      continue;
    }

    if (!Array.isArray(cards) || !cards.length) continue;

    // On tente plusieurs cartes dans ce set pour être sûr d'avoir une image
    for (let pickTry = 0; pickTry < 12; pickTry++) {
      const c = cards[Math.floor(Math.random() * cards.length)] || {};

      const name =
        pickFirst(c, ["name", "card_name", "title"]) || "Unknown";

      const setName =
        pickFirst(s, ["name", "set_name"]) ||
        pickFirst(c, ["set_name", "setName"]) ||
        `Set ${setCode}`;

      const rarity = pickFirst(c, ["rarity"]) || "";

      const { low, high } = pickImageLorcana(c);
      if (!low) continue;

      // ✅ binder-friendly ids (setId / localId / cardId)
      const cardId =
        pickFirst(c, ["id", "card_id", "cardId", "uuid"]) ||
        null;

      const setId = String(setCode || "lorcana");

      const localId =
        pickFirst(c, ["collector_number", "collectorNumber", "number", "card_number", "localId", "local_id"]) ||
        "";

      console.log("🌐 source=LORCAST");

      return {
        cardId,                        // ✅
        setId,                         // ✅
        localId: String(localId || ""),// ✅
        name,
        set: setName,
        rarity,
        image: low,
        imageHigh: high || low
      };
    }
  }

  throw new Error("Lorcana: impossible de trouver une carte avec image");
}

  //DBZ//

  if (game === "dragonball") {
  const c = drawOfflineDragonballCard();
  console.log("📦 source=OFFLINE_DRAGONBALL");
  return c;
}
// UNION ARENA //
if (game === "unionarena") {
  const c = drawOfflineUnionArenaCard();

  const img =
    isValidUnionArenaImage(c.imageHigh) ? c.imageHigh :
    isValidUnionArenaImage(c.image) ? c.image :
    null;

  if (!img) {
    throw new Error("Union Arena: image invalide");
  }

  return {
    cardId: c.cardId || null,
    setId: c.setId || null,
    localId: c.localId || null,
    name: c.name || "",
    set: c.set || c.setName || c.series || "Union Arena",
    image: img,
    imageHigh: img
  };
}
// SENPAI GODDESS HAVEN //
if (game === "senpaigodesshaven") {
  const c = drawOfflineSenpaiCard();
  return {
    cardId: c.cardId || null,
    setId: c.setId || null,
    localId: c.localId || null,
    name: c.name || "",
    set: c.setName || "Senpai Goddess Haven",
    image: c.image || null,
    imageHigh: c.imageHigh || c.image || null
  };
}
  // ----- POKEMON OFFLINE / ONLINE (TCGDEX) -----
  if (FORCE_OFFLINE) {
    const c = drawOfflinePokemonCard();
    console.log("📦 source=OFFLINE_POKEMON");
    return c;
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

  const setId = c.set?.id || null;
  const localId = String(c.localId || "").trim();

  const lowFromApi  = normalizeImageField(c.image, "low", "webp");
  const highFromApi = normalizeImageField(c.image, "high", "webp");

  let low = lowFromApi;
  let high = highFromApi;

  if (!low && setId && localId) {
    const found = await firstWorkingTcgdexImages(setId, localId, c);
    if (found) {
      low = found.image;
      high = found.imageHigh;
      console.log(`🌐 source=TCGDEX assets lang=${found.lang} serie=${found.serie} set=${setId}`);
    }
  }

  if (!low) continue;

  console.log(`🌐 source=TCGDEX set=${setId}`);

  return {
    cardId: c.id || pick.id,
    setId,
    localId,
    name: c.name || pick.name || "Unknown",
    set: c.set?.name || c.set?.id || "Unknown",
    rarity: c.rarity || "",
    image: low,
    imageHigh: high || low,
  };
}

if (offlinePokemonCards?.length) {
  const c = drawOfflinePokemonCard();
  console.log("📦 source=OFFLINE_POKEMON_FALLBACK");
  return c;
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
const COST_FIVE = COST_ONE * 5;

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
  await applyTicketsForUser(req.user.id);

  const userQ = await pool.query(
  `SELECT name, money, friendCode, xp, avatar, tickets FROM users WHERE id=$1`,
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
    xp: Number(u?.xp || 0),
    level: levelForXp(u?.xp || 0),
    avatar: u?.avatar || "",
    tickets: Number(u?.tickets || 0),
    dollax:  Number(u?.money  || 0),
  });
});
app.post("/api/open", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const game = getGame(req);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // paiement atomique
    const payQ = await client.query(
      `UPDATE users
       SET money = money - $1
       WHERE id = $2
         AND money >= $1
       RETURNING money`,
      [COST_ONE, req.user.id]
    );

    if (!payQ.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas assez de Dollax" });
    }

    const moneyAfterPay = Number(payQ.rows[0].money || 0);

    let c;
    try {
      c = await drawCard(game);
    } catch (e) {
      console.error("❌ drawCard failed:", { game, message: e?.message, stack: e?.stack });
      await client.query("ROLLBACK");
      return res.status(502).json({ error: e?.message || "Erreur image (réessaie)" });
    }

    const grade = rollGrade();
    const mint = rollMintForGrade(grade);
    const now = Date.now();
    const xpAdd = xpForOpen(grade);

    const idKey = `${game}__${c.setId || "unknown"}__${c.localId || "0"}__${c.cardId || "unknown"}`;

    await client.query(
      `UPDATE users SET xp = xp + $1 WHERE id=$2`,
      [xpAdd, req.user.id]
    );

    await client.query(
      `INSERT INTO pulls (user_id, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        req.user.id,
        game,
        c.cardId || null,
        c.setId || null,
        c.localId || null,
        c.name,
        c.set,
        c.image,
        c.imageHigh || c.image,
        grade,
        mint,
        now,
      ]
    );

    await client.query(
      `
      INSERT INTO collection
        (user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13)
      ON CONFLICT (user_id, idKey)
      DO UPDATE SET
        count = collection.count + 1,
        grade = GREATEST(collection.grade, EXCLUDED.grade),
        mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
        imageHigh = COALESCE(EXCLUDED.imageHigh, collection.imageHigh),
        lastAt = EXCLUDED.lastAt,
        cardId = COALESCE(collection.cardId, EXCLUDED.cardId),
        setId  = COALESCE(collection.setId,  EXCLUDED.setId),
        localId= COALESCE(collection.localId,EXCLUDED.localId)
      `,
      [
        req.user.id,
        idKey,
        game,
        c.cardId || null,
        c.setId || null,
        c.localId || null,
        c.name,
        c.set,
        c.image,
        c.imageHigh || c.image,
        grade,
        mint,
        now,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      money: moneyAfterPay,
      xpAdd,
      card: {
        idKey,
        game,
        name: c.name,
        set: c.set,
        cardId: c.cardId || null,
        setId: c.setId || null,
        localId: c.localId || null,
        image: c.image,
        imageHigh: c.imageHigh || c.image,
        grade,
        mint: Boolean(mint),
      },
    });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("❌ /api/open failed:", e);
    return res.status(500).json({ error: "Open failed" });
  } finally {
    client.release();
  }
});


app.post("/api/open_multi", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const game = getGame(req);
  const amount = Math.max(1, Math.min(5, Number(req.body?.amount || 5) | 0));
  const totalCost = COST_ONE * amount;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // paiement atomique
    const payQ = await client.query(
      `UPDATE users
       SET money = money - $1
       WHERE id = $2
         AND money >= $1
       RETURNING money`,
      [totalCost, req.user.id]
    );

    if (!payQ.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas assez de Dollax" });
    }

    const moneyAfterPay = Number(payQ.rows[0].money || 0);

    const now = Date.now();
    const pulls = [];
    let xpTotal = 0;

    for (let i = 0; i < amount; i++) {
      let c;
      try {
        c = await drawCard(game);
      } catch (e) {
        console.error("❌ drawCard failed in /api/open_multi:", e);
        await client.query("ROLLBACK");
        return res.status(502).json({ error: e?.message || "Erreur image (réessaie)" });
      }

      const grade = rollGrade();
      const mint = rollMintForGrade(grade);
      const xpAdd = xpForOpen(grade);
      xpTotal += xpAdd;

      const idKey = `${game}__${c.setId || "unknown"}__${c.localId || "0"}__${c.cardId || "unknown"}`;

      await client.query(
        `INSERT INTO pulls (user_id, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          req.user.id,
          game,
          c.cardId || null,
          c.setId || null,
          c.localId || null,
          c.name,
          c.set,
          c.image,
          c.imageHigh || c.image,
          grade,
          mint,
          now + i
        ]
      );

      await client.query(
        `
        INSERT INTO collection
          (user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13)
        ON CONFLICT (user_id, idKey)
        DO UPDATE SET
          count = collection.count + 1,
          grade = GREATEST(collection.grade, EXCLUDED.grade),
          mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
          imageHigh = COALESCE(EXCLUDED.imageHigh, collection.imageHigh),
          lastAt = EXCLUDED.lastAt,
          cardId = COALESCE(collection.cardId, EXCLUDED.cardId),
          setId  = COALESCE(collection.setId,  EXCLUDED.setId),
          localId= COALESCE(collection.localId,EXCLUDED.localId)
        `,
        [
          req.user.id,
          idKey,
          game,
          c.cardId || null,
          c.setId || null,
          c.localId || null,
          c.name,
          c.set,
          c.image,
          c.imageHigh || c.image,
          grade,
          mint,
          now + i
        ]
      );

      pulls.push({
        idKey,
        game,
        name: c.name,
        set: c.set,
        cardId: c.cardId || null,
        setId: c.setId || null,
        localId: c.localId || null,
        image: c.image,
        imageHigh: c.imageHigh || c.image,
        grade,
        mint: Boolean(mint),
        xpAdd
      });
    }

    await client.query(
      `UPDATE users SET xp = xp + $1 WHERE id=$2`,
      [xpTotal, req.user.id]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      money: moneyAfterPay,
      xpAdd: xpTotal,
      pulls
    });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("❌ /api/open_multi failed:", e);
    return res.status(500).json({ error: "Open multi failed" });
  } finally {
    client.release();
  }
});


app.get("/api/collection", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const game = getGame(req);

  const items = await pool.query(
  `SELECT idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt
   FROM collection 
   WHERE user_id=$1 AND game=$2
   ORDER BY lastAt DESC`,
  [req.user.id, game]
);

  const me = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);

  res.json({
    money: me.rows[0]?.money || 0,
    items: items.rows.map((x) => ({
      idKey: x.idkey || x.idKey,
      game: x.game || game, 
      name: x.name,
      set: x.setname || x.setName,
      cardId: x.cardid || x.cardId || null,
      setId: x.setid || x.setId || null,
      localId: x.localid || x.localId || null,
      image: x.image,
      imageHigh: x.imagehigh || x.imageHigh || null,
      grade: x.grade,
      mint: Boolean(x.mint),
      count: x.count,
      lastAt: Number(x.lastat || x.lastAt),
    })),
  });
});

app.get("/api/sets", auth, async (req, res) => {
  const game = getGame(req);

  try {
    // ===== POKEMON =====
    if (game === "pokemon") {
    if (FORCE_OFFLINE && offlinePokemonSets.length) {
      return res.json({
        sets: offlinePokemonSets.map(s => ({
          id: s.id,
          name: s.name
        }))
      });
    }

    const list = await getPokemonSetsCached();
    return res.json({ sets: list.map(s => ({ id: s.id, name: s.name })) });
  }

    // ===== LORCANA =====
    if (game === "lorcana") {
      const list = await getLorcanaSets();
      // lorcast: code + name
      return res.json({
        sets: list.map(s => ({
          id: String(s.code || s.id || ""),
          name: String(s.name || s.code || "Set")
        })).filter(s => s.id)
      });
    }

    // ===== ONE PIECE =====
    if (game === "onepiece") {
      const list = await getOpBriefList();

      // on fabrique des "sets" à partir des champs existants
      const map = new Map();
      for (const c of list) {
        const setName = pickFirst(c, ["set_name", "setName", "set", "series"]) || "One Piece";
        const setId   = pickFirst(c, ["set_id", "setId", "set_code", "setCode", "series_id"]) || setName;
        const id = String(setId);
        if (!map.has(id)) map.set(id, { id, name: String(setName) });
      }

      return res.json({ sets: Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name)) });
    }

    // DRAGON BALL //

    if (game === "dragonball") {
      const bySet = new Map();

      for (const c of offlineDragonballCards) {
        const setId = String(c?.setId || "").trim();
        if (!setId) continue;

        if (!bySet.has(setId)) {
          bySet.set(setId, {
            id: setId,
            name: String(c?.set || c?.setName || setId).trim() || setId
          });
        }
      }

      const sets = Array.from(bySet.values()).sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" })
      );

      return res.json({ sets });
    }

    if (game === "unionarena") {
  const bySet = new Map();

  for (const c of offlineUnionArenaCards) {
    const setId = String(c?.setId || "").trim();
    if (!setId) continue;

    if (!bySet.has(setId)) {
      bySet.set(setId, {
        id: setId,
        name: String(c?.set || c?.setName || setId).trim() || setId
      });
    }
  }

  const sets = Array.from(bySet.values()).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" })
  );

  return res.json({ sets });
}

    if (game === "senpaigodesshaven") {
      const bySet = new Map();
      for (const c of offlineSenpaiCards) {
        const setId = String(c?.setId || "").trim();
        if (!setId) continue;
        if (!bySet.has(setId)) {
          bySet.set(setId, {
            id: setId,
            name: String(c?.setName || setId).trim() || setId
          });
        }
      }
      const sets = Array.from(bySet.values()).sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" })
      );
      return res.json({ sets });
    }

    return res.json({ sets: [] });
  } catch (e) {
    return res.status(502).json({ error: "sets failed" });
  }
});

  app.get("/api/set_cards", auth, async (req, res) => {
    const game = getGame(req);
    const setId = String(req.query.setId || "").trim();
    if (!setId) return res.status(400).json({ error: "Missing setId" });

    try {

    
    // ===== POKEMON =====
    if (game === "pokemon") {
    if (FORCE_OFFLINE && offlinePokemonCards.length) {
      const cards = offlinePokemonCardsBySet.get(setId) || [];

      return res.json({
        setId,
        cards: cards.map(c => ({
          cardId: c.cardId || "",
          localId: String(c.localId || ""),
          name: c.name || "",
          image: c.image || null,
          imageHigh: c.imageHigh || c.image || null
        }))
      });
    }

    const data = await getPokemonSetCardsCached(setId);
    const cards = Array.isArray(data.cards) ? data.cards : [];

    const out = [];
    for (const c of cards) {
      const localId = String(c.localId || "").trim();

      const lowFromApi  = normalizeImageField(c.image, "low", "webp");
      const highFromApi = normalizeImageField(c.image, "high", "webp");

      let low = lowFromApi;
      let high = highFromApi;

      if (!low && setId && localId) {
        const found = await firstWorkingTcgdexImages(setId, localId, c);
        if (found) {
          low = found.image;
          high = found.imageHigh;
        } else {
          console.log(`❌ no image found for set=${setId} localId=${localId} cardId=${c.id || ""}`);
        }
      }

      out.push({
        cardId: c.id,
        localId,
        name: c.name || "",
        image: low || null,
        imageHigh: high || low || null
      });
    }

    return res.json({
      setId,
      cards: out
    });
  }
      
    // DRAGON BALL //
    if (game === "dragonball") {
  const cards = offlineDragonballCardsBySet.get(setId) || [];

  return res.json({
    setId,
    cards: cards.map(c => ({
      cardId: c.cardId || "",
      localId: String(c.localId || ""),
      name: c.name || "",
      image: c.image || null,
      imageHigh: c.imageHigh || c.image || null
    }))
  });
}
//UNION ARENA //
    if (game === "unionarena") {

  const rawCards = offlineUnionArenaCardsBySet.get(setId) || [];

  console.log("------ UNION ARENA DEBUG ------");
  console.log("setId =", setId);
  console.log("raw cards count =", rawCards.length);

  const cards = rawCards;

  console.log("final cards count =", cards.length);
  console.log("-------------------------------");

  return res.json({
    setId,
    cards: cards.map(c => ({
      cardId: c.cardId || "",
      localId: String(c.localId || ""),
      name: c.name || "",
      image: c.image || null,
      imageHigh: c.imageHigh || c.image || null
    }))
  });
}
    // SENPAI GODDESS HAVEN //
    if (game === "senpaigodesshaven") {
      const cards = offlineSenpaiCardsBySet.get(setId) || [];
      return res.json({
        setId,
        cards: cards.map(c => ({
          cardId: c.cardId || "",
          localId: String(c.localId || ""),
          name: c.name || "",
          image: c.image || null,
          imageHigh: c.imageHigh || c.image || null
        }))
      });
    }
    // ===== LORCANA =====
    if (game === "lorcana") {
      const cards = await getLorcanaCardsForSet(setId);
      const out = cards.map(c => {
        const { low, high } = pickImageLorcana(c);
        const cardId  = String(c.id || c.card_id || c.uuid || "");
        const localId = String(c.collector_number || c.number || c.card_number || "");
        return {
          cardId,
          localId,
          name: String(c.name || ""),
          image: low || null,
          imageHigh: high || low || null,
        };
      }).filter(x => x.cardId);

      return res.json({ setId, cards: out });
    }

    // ===== ONE PIECE =====
    if (game === "onepiece") {
      const list = await getOpBriefList();

      const out = list
        .filter(c => {
          const sId = pickFirst(c, ["set_id", "setId", "set_code", "setCode", "series_id"]) || (pickFirst(c, ["set_name","setName","set","series"]) || "One Piece");
          return String(sId) === setId;
        })
        .map(c => {
          const cardId  = pickFirst(c, ["card_set_id","cardSetId","card_id","cardId","id"]) || "";
          const localId = pickFirst(c, ["card_number","number","collector_number","collectorNumber"]) || "";
          const name    = pickFirst(c, ["card_name","name","title"]) || "";
          const image   = pickFirst(c, ["card_image","image_url","imageUrl","image","img"]) || null;

          return {
            cardId: String(cardId),
            localId: String(localId),
            name: String(name),
            image,
            imageHigh: image
          };
        })
        .filter(x => x.cardId);

      return res.json({ setId, cards: out });
    }

    return res.json({ setId, cards: [] });
  } catch (e) {
    return res.status(502).json({ error: "set_cards failed" });
  }
});

app.get("/api/pulls", auth, async (req, res) => {
  const game = getGame(req);

  const rows = await pool.query(
  `SELECT game, name, setName, image, imageHigh, grade, mint, at
   FROM pulls
   WHERE user_id=$1 AND game=$2
   ORDER BY at DESC
   LIMIT 80`,
  [req.user.id, game]
);

  res.json({
    pulls: rows.rows.map((r) => ({
      name: r.name,
      set: r.setname || r.setName,
      image: r.image,
      imageHigh: r.imagehigh || r.imageHigh || null,
      grade: r.grade,
      mint: Boolean(r.mint),
      at: Number(r.at),
    })),
  });
});

app.post("/api/sell", auth, async (req, res) => {
  const idKey = String(req.body?.idKey || "");
  const qty = Math.max(1, Number(req.body?.qty || 1) | 0);
  if (!idKey) return res.status(400).json({ error: "Missing idKey" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itemQ = await client.query(
      `SELECT count, grade, mint FROM collection
       WHERE user_id=$1 AND idKey=$2
       FOR UPDATE`,
      [req.user.id, idKey]
    );

    const it = itemQ.rows[0];
    if (!it) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not owned" });
    }

    const owned = Number(it.count) || 0;
    if (owned < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Quantité insuffisante" });
    }

    const unitPrice = sellPriceFor(it.grade, Number(it.mint) === 1);
    const total = unitPrice * qty;

    if (owned === qty) {
      await client.query(
        `DELETE FROM collection WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey]
      );
    } else {
      await client.query(
        `UPDATE collection SET count = count - $3 WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey, qty]
      );
    }

    // money
    await client.query(
      `UPDATE users SET money = money + $1 WHERE id=$2`,
      [total, req.user.id]
    );

    // xp
    const xpAdd = xpForSell(unitPrice, qty);
    await client.query(
      `UPDATE users SET xp = xp + $1 WHERE id=$2`,
      [xpAdd, req.user.id]
    );

    await client.query("COMMIT");

    const me = await pool.query(`SELECT money, xp FROM users WHERE id=$1`, [req.user.id]);
    res.json({
      ok: true,
      money: me.rows[0]?.money || 0,
      xp: Number(me.rows[0]?.xp || 0),
      unitPrice,
      total,
      xpAdd
    });

  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Sell failed" });
  } finally {
    client.release();
  }
});
// SELL BULK//

app.post("/api/sell_bulk", auth, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const clean = items
    .map(x => ({
      idKey: String(x?.idKey || ""),
      qty: Math.max(1, Number(x?.qty || 1) | 0),
    }))
    .filter(x => x.idKey);

  if (!clean.length) return res.status(400).json({ error: "Empty selection" });
  if (clean.length > 200) return res.status(400).json({ error: "Too many items" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const keys = clean.map(x => x.idKey);

    const q = await client.query(
      `SELECT idKey, count, grade, mint
       FROM collection
       WHERE user_id=$1 AND idKey = ANY($2::text[])
       FOR UPDATE`,
      [req.user.id, keys]
    );

    const byKey = new Map(q.rows.map(r => [r.idkey || r.idKey, r]));

    let total = 0;
    let xpTotal = 0;

    // 1) check + compute totals
    for (const it of clean) {
      const row = byKey.get(it.idKey);
      if (!row) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Not owned: " + it.idKey });
      }

      const owned = Number(row.count) || 0;
      if (owned < it.qty) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Quantité insuffisante: " + it.idKey });
      }

      const unit = sellPriceFor(row.grade, Number(row.mint) === 1);
      total += unit * it.qty;

      // ✅ XP bulk
      xpTotal += xpForSell(unit, it.qty);
    }

    // 2) update/remove cards
    for (const it of clean) {
      const row = byKey.get(it.idKey);
      const owned = Number(row.count) || 0;

      if (owned === it.qty) {
        await client.query(
          `DELETE FROM collection WHERE user_id=$1 AND idKey=$2`,
          [req.user.id, it.idKey]
        );
      } else {
        await client.query(
          `UPDATE collection SET count = count - $3 WHERE user_id=$1 AND idKey=$2`,
          [req.user.id, it.idKey, it.qty]
        );
      }
    }

    // 3) add money + xp
    await client.query(
      `UPDATE users SET money = money + $1 WHERE id=$2`,
      [total, req.user.id]
    );

    if (xpTotal > 0) {
      await client.query(
        `UPDATE users SET xp = xp + $1 WHERE id=$2`,
        [xpTotal, req.user.id]
      );
    }

    await client.query("COMMIT");

    const me = await pool.query(`SELECT money, xp FROM users WHERE id=$1`, [req.user.id]);
    res.json({
      ok: true,
      money: me.rows[0]?.money || 0,
      xp: Number(me.rows[0]?.xp || 0),
      total,
      xpTotal
    });

  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Sell bulk failed" });
  } finally {
    client.release();
  }
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

  const game = getGame(req); // ✅ pokemon / onepiece

  // autorisation : seulement si c’est dans ta liste d’amis
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
    `
    SELECT idKey, game, name, setName, image, grade, mint, count, lastAt
    FROM collection
    WHERE user_id=$1 AND game=$2
    ORDER BY lastAt DESC
    `,
    [friend.id, game]
  );

  res.json({
    items: items.rows.map((x) => ({
      idKey: x.idkey || x.idKey,
      game: x.game || game,
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
// MARKETPLACE ROUTES
// =========================

// GET market listings
// =========================
// MARKETPLACE ROUTES (MULTI GAME OK)
// =========================

// GET market listings
app.get("/api/market", auth, async (req, res) => {
  const q = String(req.query.search || "").toLowerCase().trim();
  const sort = String(req.query.sort || "recent");
  const game = getGame(req); // filtre par jeu (pokemon/onepiece)

  const params = [game];
  let where = `WHERE m.game = $1`;

  if (q) {
    params.push(`%${q}%`);
    where += ` AND (LOWER(m.name) LIKE $2 OR LOWER(m.setName) LIKE $2)`;
  }

  let order = "m.createdAt DESC";
  if (sort === "price") order = "m.price ASC, m.createdAt DESC";
  if (sort === "grade") order = "m.grade DESC, m.createdAt DESC";
  if (sort === "name") order = "m.name ASC, m.createdAt DESC";

  const { rows } = await pool.query(
    `
    SELECT 
      m.id,
      m.seller_user_id AS "sellerUserId",
      u.name AS "sellerName",
      m.idKey,
      m.game,
      m.name,
      m.setName,
      m.image,
      m.grade,
      m.mint,
      m.price,
      m.qty,
      m.createdAt
    FROM market_listings m
    JOIN users u ON u.id = m.seller_user_id
    ${where}
    ORDER BY ${order}
    LIMIT 200
    `,
    params
  );

  res.json({
    listings: rows.map((r) => ({
      ...r,
      game: r.game || "pokemon",
      mint: Boolean(r.mint),
      idKey: r.idkey || r.idKey,
      setName: r.setname || r.setName,
      sellerName: r.sellerName || r.sellername,
    })),
  });
});

// POST create listing
app.post("/api/market/list", auth, async (req, res) => {
  const idKey = String(req.body?.idKey || "");
  const qty = Math.max(1, Number(req.body?.qty || 1) | 0);
  const price = Math.max(1, Number(req.body?.price || 1) | 0);

  if (!idKey) return res.status(400).json({ error: "Missing idKey" });

  // game vient de l'idKey (game__...__...__...)
  const gameFromKey = String(idKey.split("__")[0] || "pokemon").toLowerCase();
  const safeGame =
    gameFromKey === "onepiece" ? "onepiece" :
    gameFromKey === "lorcana" ? "lorcana" :
    gameFromKey === "dragonball" ? "dragonball" :
    gameFromKey === "unionarena" ? "unionarena" :
    gameFromKey === "senpaigodesshaven" ? "senpaigodesshaven" :
    "pokemon";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ On récupère aussi cardId/setId/localId/imageHigh depuis la collection
    const cQ = await client.query(
      `SELECT game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count
       FROM collection
       WHERE user_id=$1 AND idKey=$2
       FOR UPDATE`,
      [req.user.id, idKey]
    );

    const it = cQ.rows[0];
    if (!it) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not owned" });
    }
    if (Number(it.count) < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Quantité insuffisante" });
    }

    // retire de la collection
    if (Number(it.count) === qty) {
      await client.query(`DELETE FROM collection WHERE user_id=$1 AND idKey=$2`, [
        req.user.id,
        idKey,
      ]);
    } else {
      await client.query(
        `UPDATE collection SET count = count - $3 WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey, qty]
      );
    }

    const now = Date.now();

    // ✅ On stocke tout dans market_listings (y compris binder ids + imageHigh)
    const ins = await client.query(
      `INSERT INTO market_listings
        (seller_user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, price, qty, createdAt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        req.user.id,
        idKey,
        it.game || safeGame,
        it.cardid || it.cardId || null,
        it.setid  || it.setId  || null,
        it.localid|| it.localId|| null,
        it.name,
        it.setname || it.setName,
        it.image,
        it.imagehigh || it.imageHigh || it.image,
        it.grade,
        it.mint ? 1 : 0,
        price,
        qty,
        now,
      ]
    );

    await client.query("COMMIT");
    res.json({ ok: true, listingId: ins.rows[0].id });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Market list failed" });
  } finally {
    client.release();
  }
});

// POST buy listing
app.post("/api/market/buy", auth, async (req, res) => {
  await applyPayForUser(req.user.id);

  const listingId = Number(req.body?.listingId || 0) | 0;
  const qty = Math.max(1, Number(req.body?.qty || 1) | 0);
  if (!listingId) return res.status(400).json({ error: "Missing listingId" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ On récupère aussi binder ids + imageHigh
    const lQ = await client.query(
      `SELECT id, seller_user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, price, qty
       FROM market_listings
       WHERE id=$1
       FOR UPDATE`,
      [listingId]
    );

    const l = lQ.rows[0];
    if (!l) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Listing introuvable" });
    }
    if (Number(l.qty) < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Plus assez en stock" });
    }
    if (Number(l.seller_user_id) === Number(req.user.id)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Tu ne peux pas acheter ta propre vente" });
    }

    // lock buyer money
    const bQ = await client.query(`SELECT money FROM users WHERE id=$1 FOR UPDATE`, [req.user.id]);
    const buyerMoney = Number(bQ.rows[0]?.money ?? 0);
    const total = Number(l.price) * qty;

    if (buyerMoney < total) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas assez de Pokédollars" });
    }

    // move money
    await client.query(`UPDATE users SET money = money - $1 WHERE id=$2`, [total, req.user.id]);
    await client.query(`UPDATE users SET money = money + $1 WHERE id=$2`, [total, l.seller_user_id]);

    const now = Date.now();

    // ✅ Fallback parse si jamais vieux listing sans colonnes
    const key = String(l.idkey || l.idKey || "");
    const ids = parseIdKeyServer(key);

    const gameFinal = (l.game || ids.game || "pokemon");
    const cardIdFinal  = (l.cardid  || l.cardId  || ids.cardId  || null);
    const setIdFinal   = (l.setid   || l.setId   || ids.setId   || null);
    const localIdFinal = (l.localid || l.localId || ids.localId || null);

    const imageHighFinal = (l.imagehigh || l.imageHigh || l.image);

    // ✅ remet en collection AVEC binder fields + imageHigh
    await client.query(
      `
      INSERT INTO collection
        (user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (user_id, idKey)
      DO UPDATE SET
        count = collection.count + EXCLUDED.count,
        grade = GREATEST(collection.grade, EXCLUDED.grade),
        mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
        imageHigh = COALESCE(collection.imageHigh, EXCLUDED.imageHigh),
        lastAt = EXCLUDED.lastAt,
        cardId = COALESCE(collection.cardId, EXCLUDED.cardId),
        setId  = COALESCE(collection.setId,  EXCLUDED.setId),
        localId= COALESCE(collection.localId,EXCLUDED.localId)
      `,
      [
        req.user.id,
        key,
        gameFinal,
        cardIdFinal,
        setIdFinal,
        localIdFinal,
        l.name,
        l.setname || l.setName,
        l.image,
        imageHighFinal,
        l.grade,
        l.mint ? 1 : 0,
        qty,
        now,
      ]
    );

    // update/remove listing stock
    if (Number(l.qty) === qty) {
      await client.query(`DELETE FROM market_listings WHERE id=$1`, [listingId]);
    } else {
      await client.query(`UPDATE market_listings SET qty = qty - $2 WHERE id=$1`, [listingId, qty]);
    }

    await client.query("COMMIT");

    // notif vendeur (hors transaction)
    await notify(
      l.seller_user_id,
      "sale",
      "💰 Vente réussie !",
      `${qty}× ${l.name} vendu pour ${total}💵`
    );

    const me = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
    res.json({ ok: true, money: me.rows[0]?.money || 0 });

  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Buy failed" });
  } finally {
    client.release();
  }
});

// GET my listings
app.get("/api/market/mine", auth, async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT 
      m.id,
      m.seller_user_id AS "sellerUserId",
      u.name AS "sellerName",
      m.idKey,
      m.game,
      m.name,
      m.setName,
      m.image,
      m.grade,
      m.mint,
      m.price,
      m.qty,
      m.createdAt
    FROM market_listings m
    JOIN users u ON u.id = m.seller_user_id
    WHERE m.seller_user_id = $1
    ORDER BY m.createdAt DESC
    LIMIT 200
    `,
    [req.user.id]
  );

  res.json({
    listings: rows.map((r) => ({
      ...r,
      game: r.game || "pokemon",
      mint: Boolean(r.mint),
      idKey: r.idkey || r.idKey,
      setName: r.setname || r.setName,
      sellerName: r.sellerName || r.sellername,
    })),
  });
});

// POST cancel listing (return cards to seller)
app.post("/api/market/cancel", auth, async (req, res) => {
  const listingId = Number(req.body?.listingId || 0) | 0;
  const qty = Math.max(1, Number(req.body?.qty || 1) | 0);
  if (!listingId) return res.status(400).json({ error: "Missing listingId" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lQ = await client.query(
      `SELECT id, seller_user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, qty
       FROM market_listings
       WHERE id=$1
       FOR UPDATE`,
      [listingId]
    );
    const l = lQ.rows[0];

    if (!l) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Listing introuvable" });
    }
    if (Number(l.seller_user_id) !== Number(req.user.id)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Interdit" });
    }
    if (Number(l.qty) < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Quantité invalide" });
    }

    const now = Date.now();

    const key = String(l.idkey || l.idKey || "");
    const ids = parseIdKeyServer(key);

    const gameFinal = (l.game || ids.game || "pokemon");
    const cardIdFinal  = (l.cardid  || l.cardId  || ids.cardId  || null);
    const setIdFinal   = (l.setid   || l.setId   || ids.setId   || null);
    const localIdFinal = (l.localid || l.localId || ids.localId || null);
    const imageHighFinal = (l.imagehigh || l.imageHigh || l.image);

    await client.query(
      `
      INSERT INTO collection
        (user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (user_id, idKey)
      DO UPDATE SET
        count = collection.count + EXCLUDED.count,
        grade = GREATEST(collection.grade, EXCLUDED.grade),
        mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
        imageHigh = COALESCE(collection.imageHigh, EXCLUDED.imageHigh),
        lastAt = EXCLUDED.lastAt,
        cardId = COALESCE(collection.cardId, EXCLUDED.cardId),
        setId  = COALESCE(collection.setId,  EXCLUDED.setId),
        localId= COALESCE(collection.localId,EXCLUDED.localId)
      `,
      [
        req.user.id,
        key,
        gameFinal,
        cardIdFinal,
        setIdFinal,
        localIdFinal,
        l.name,
        l.setname || l.setName,
        l.image,
        imageHighFinal,
        l.grade,
        l.mint ? 1 : 0,
        qty,
        now,
      ]
    );

    if (Number(l.qty) === qty) {
      await client.query(`DELETE FROM market_listings WHERE id=$1`, [listingId]);
    } else {
      await client.query(`UPDATE market_listings SET qty = qty - $2 WHERE id=$1`, [listingId, qty]);
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Cancel failed" });
  } finally {
    client.release();
  }
});

// GET notifications (latest)
app.get("/api/notifications", auth, async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20) | 0));
  const onlyUnread = String(req.query.unread || "") === "1";

  const { rows } = await pool.query(
    `
    SELECT id, type, title, body, meta, is_read, createdAt
    FROM notifications
    WHERE user_id=$1
      ${onlyUnread ? "AND is_read=0" : ""}
    ORDER BY createdAt DESC
    LIMIT ${limit}
    `,
    [req.user.id]
  );

  const unreadQ = await pool.query(
    `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id=$1 AND is_read=0`,
    [req.user.id]
  );

  res.json({
    unread: unreadQ.rows[0]?.c || 0,
    notifications: rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      meta: r.meta,
      isRead: Boolean(r.is_read),
      createdAt: Number(r.createdat || r.createdAt),
    }))
  });
});

// POST mark as read
app.post("/api/notifications/read", auth, async (req, res) => {
  const id = Number(req.body?.id || 0) | 0;
  if (!id) return res.status(400).json({ error: "Missing id" });

  await pool.query(
    `UPDATE notifications SET is_read=1 WHERE user_id=$1 AND id=$2`,
    [req.user.id, id]
  );

  res.json({ ok: true });
});

// POST mark all as read
app.post("/api/notifications/read_all", auth, async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read=1 WHERE user_id=$1`,
    [req.user.id]
  );
  res.json({ ok: true });
});

app.get("/api/profile/me", auth, async (req, res) => {
  const uQ = await pool.query(
    `SELECT name, friendCode, avatar, bio, banner, xp FROM users WHERE id=$1`,
    [req.user.id]
  );
  const u = uQ.rows[0];

  const favQ = await pool.query(
    `
    SELECT c.idKey, c.name, c.setName, c.image, c.grade, c.mint, c.game
    FROM favorites f
    JOIN collection c ON c.user_id=f.user_id AND c.idKey=f.idKey
    WHERE f.user_id=$1
    ORDER BY f.createdAt DESC
    LIMIT 12
    `,
    [req.user.id]
  );

  const xp = Number(u?.xp || 0);

  res.json({
    name: u.name,
    friendCode: u.friendcode || u.friendCode,
    avatar: u.avatar || "",
    bio: u.bio || "",
    banner: u.banner || "",
    xp,
    level: levelForXp(xp),
    favorites: favQ.rows.map(r => ({
      idKey: r.idkey || r.idKey,
      game: r.game || "pokemon",
      name: r.name,
      setName: r.setname || r.setName,
      image: r.image,
      grade: r.grade,
      mint: Boolean(r.mint),
    }))
  });
});

app.post("/api/profile/update", auth, async (req, res) => {
  const avatar = String(req.body?.avatar || "").trim();
  const bio = String(req.body?.bio || "").trim().slice(0, 140); // limite safe
  const banner = String(req.body?.banner || "").trim().slice(0, 500);

  await pool.query(
  `UPDATE users SET avatar=$1, bio=$2, banner=$3 WHERE id=$4`,
  [avatar || null, bio || null, banner || null, req.user.id]
);

  res.json({ ok: true });
});

app.post("/api/favorites/toggle", auth, async (req, res) => {
  const idKey = String(req.body?.idKey || "");
  if (!idKey) return res.status(400).json({ error: "Missing idKey" });

  // vérif que la carte est bien à toi
  const own = await pool.query(
    `SELECT 1 FROM collection WHERE user_id=$1 AND idKey=$2`,
    [req.user.id, idKey]
  );
  if (!own.rows[0]) return res.status(404).json({ error: "Not owned" });

  const exists = await pool.query(
    `SELECT 1 FROM favorites WHERE user_id=$1 AND idKey=$2`,
    [req.user.id, idKey]
  );

  if (exists.rows[0]) {
    await pool.query(`DELETE FROM favorites WHERE user_id=$1 AND idKey=$2`, [req.user.id, idKey]);
    return res.json({ ok: true, isFav: false });
  } else {
    // limite à 12 favoris
    const cnt = await pool.query(`SELECT COUNT(*)::int AS c FROM favorites WHERE user_id=$1`, [req.user.id]);
    if ((cnt.rows[0]?.c || 0) >= 12) return res.status(400).json({ error: "Max 12 favoris" });

    await pool.query(
      `INSERT INTO favorites (user_id, idKey, createdAt) VALUES ($1,$2,$3)`,
      [req.user.id, idKey, Date.now()]
    );
    return res.json({ ok: true, isFav: true });
  }
});

app.get("/api/profile/:friendCode", auth, async (req, res) => {
  const friendCode = String(req.params.friendCode || "").trim().toUpperCase();
  if (!friendCode) return res.status(400).json({ error: "Missing friendCode" });

  const q = await pool.query(
    `
    SELECT u.id, u.name, u.friendCode, u.avatar, u.bio, u.banner, u.xp
    FROM friends f
    JOIN users u ON u.id = f.friend_user_id
    WHERE f.user_id=$1 AND u.friendCode=$2
    `,
    [req.user.id, friendCode]
  );

  const u = q.rows[0];
  if (!u) return res.status(403).json({ error: "Pas dans tes amis" });

  const favQ = await pool.query(
    `
    SELECT c.idKey, c.name, c.setName, c.image, c.grade, c.mint, c.game
    FROM favorites f
    JOIN collection c ON c.user_id=f.user_id AND c.idKey=f.idKey
    WHERE f.user_id=$1
    ORDER BY f.createdAt DESC
    LIMIT 12
    `,
    [u.id]
  );

  const xp = Number(u?.xp || 0);

  res.json({
    name: u.name,
    friendCode: u.friendcode || u.friendCode,
    avatar: u.avatar || "",
    bio: u.bio || "",
    banner: u.banner || "",
    xp,
    level: levelForXp(xp),
    favorites: favQ.rows.map(r => ({
      idKey: r.idkey || r.idKey,
      game: r.game || "pokemon",
      name: r.name,
      setName: r.setname || r.setName,
      image: r.image,
      grade: r.grade,
      mint: Boolean(r.mint),
    }))
  });
});

// =========================
// LEADERBOARD XP
// =========================
app.get("/api/leaderboard/xp", auth, async (req, res) => {
  const limit = Math.min(100, Math.max(5, Number(req.query.limit || 50) | 0));

  // Top joueurs
  const topQ = await pool.query(
  `
  SELECT id, name, xp, avatar, friendCode
  FROM users
  ORDER BY xp DESC, createdAt ASC, id ASC
  LIMIT $1
  `,
  [limit]
);

  // Rang du joueur connecté (global)
  const meRankQ = await pool.query(
    `
    SELECT r.rnk
    FROM (
      SELECT id, RANK() OVER (ORDER BY xp DESC, createdAt ASC, id ASC) AS rnk
      FROM users
    ) r
    WHERE r.id = $1
    `,
    [req.user.id]
  );

  const top = topQ.rows.map((u, i) => ({
    rank: i + 1,
    name: u.name,
    xp: Number(u.xp || 0),
    level: levelForXp(u.xp || 0),
    avatar: u.avatar || "",
    friendCode: u.friendcode || u.friendCode || ""
}));

  res.json({
    top,
    me: {
      rank: Number(meRankQ.rows[0]?.rnk || 0),
    }
  });
});

// =========================
// TICKETS
// =========================

// GET solde tickets + dollax + temps avant prochain ticket
app.get("/api/tickets", auth, async (req, res) => {
  await applyTicketsForUser(req.user.id);
  const { rows } = await pool.query(
    `SELECT tickets, money, lastTicketPay FROM users WHERE id=$1`,
    [req.user.id]
  );
  const u = rows[0];
  const tickets       = Number(u?.tickets || 0);
  const dollax        = Number(u?.money   || 0);
  const lastTicketPay = Number(u?.lastticketpay ?? u?.lastTicketPay ?? 0);
  const now           = Date.now();

  // Calcul du prochain ticket
  let nextTicketInMs = 0;
  if (tickets < TICKET_CAP) {
    const elapsed = now - lastTicketPay;
    const remaining = TICKET_EVERY_MS - (elapsed % TICKET_EVERY_MS);
    nextTicketInMs = remaining;
  }

  res.json({ tickets, dollax, nextTicketInMs, ticketCap: TICKET_CAP });
});

// POST jouer la slot machine
app.post("/api/slots/spin", auth, async (req, res) => {
  const bet = Math.max(1, Math.min(1000, Number(req.body?.bet) | 0));

  await applyTicketsForUser(req.user.id);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Vérifier et déduire les tickets
    const uQ = await client.query(
      `SELECT tickets, money FROM users WHERE id=$1 FOR UPDATE`,
      [req.user.id]
    );
    const u = uQ.rows[0];
    if (!u || Number(u.tickets) < bet) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas assez de tickets" });
    }

    // Tirage pondéré (même proba que côté client)
    const SYMBOLS = [
      { id:"diamant", weight:4  },  // ultra rare  ×5000
      { id:"star",    weight:6  },  // très rare   ×1000
      { id:"cards",   weight:15  },  // rare        ×400
      { id:"heart",   weight:20 },  // peu commun  ×250
      { id:"dollax",  weight:25 },  // commun      ×150
      { id:"thunder", weight:30 },  // commun      ×80
    ];
    const MULTS = { diamant:5000, star:1000, cards:400, heart:250, dollax:150, thunder:80 };
    const POOL  = SYMBOLS.flatMap(s => Array(s.weight).fill(s.id));
    const rand  = () => POOL[Math.floor(Math.random() * POOL.length)];
    const result    = [rand(), rand(), rand()];
    const [a,b,c]   = result;

    let gain = 0;
    let winType = "none";
    if (a === b && b === c) {
      gain    = bet * (MULTS[a] ?? 20);
      winType = a === "diamant" ? "jackpot" : "triple";
    } else if (a === b || b === c || a === c) {
      gain    = bet * 15;
      winType = "pair";
    }

    // Mettre à jour DB
    await client.query(
      `UPDATE users SET tickets = tickets - $1, money = money + $2 WHERE id=$3`,
      [bet, gain, req.user.id]
    );
    await client.query("COMMIT");

    // Retourner résultat + nouveau solde
    const newQ = await pool.query(
      `SELECT tickets, money FROM users WHERE id=$1`,
      [req.user.id]
    );
    res.json({
      result,
      gain,
      winType,
      tickets: Number(newQ.rows[0]?.tickets || 0),
      dollax:  Number(newQ.rows[0]?.money   || 0),
    });
  } catch(e) {
    await client.query("ROLLBACK");
    console.error("Slots spin error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
});

// =========================
// PROFILE PUBLIC (for leaderboard)
// Accessible to everyone (auth required)
// =========================
app.get("/api/profile_public/:friendCode", async (req, res) => {
  const friendCode = String(req.params.friendCode || "").trim().toUpperCase();
  if (!friendCode) return res.status(400).json({ error: "Missing friendCode" });

  const uQ = await pool.query(
    `SELECT id, name, friendCode, avatar, bio, banner, xp
     FROM users
     WHERE friendCode=$1
     LIMIT 1`,
    [friendCode]
  );

  const u = uQ.rows[0];
  if (!u) return res.status(404).json({ error: "Profil introuvable" });

  const [pQ, oQ, lQ, dQ, uAQ, sGQ] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='pokemon'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='onepiece'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='lorcana'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='dragonball'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='unionarena'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='senpaigodesshaven'`, [u.id]),
  ]);

  const pokemon = pQ.rows[0]?.total || 0;
  const onepiece = oQ.rows[0]?.total || 0;
  const lorcana = lQ.rows[0]?.total || 0;
  const dragonball = dQ.rows[0]?.total || 0;
  const unionarena = uAQ.rows[0]?.total || 0;
  const senpaigodesshaven = sGQ.rows[0]?.total || 0;

  const xp = Number(u?.xp || 0);

  res.json({
    name: u.name,
    friendCode: u.friendcode || u.friendCode,
    avatar: u.avatar || "",
    bio: u.bio || "",
    banner: u.banner || "",
    xp,
    level: levelForXp(xp),
    stats: {
    pokemon,
    onepiece,
    lorcana,
    dragonball,
    unionarena,
    senpaigodesshaven,
    total: pokemon + onepiece + lorcana + dragonball + unionarena + senpaigodesshaven
  }
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