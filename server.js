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
// OFFLINE WEISS SCHWARZ
// =========================
const OFFLINE_WEISSSCHWARZ_DIR = path.join(__dirname, "data", "weissschwarz");
const OFFLINE_WEISSSCHWARZ_CARDS_PATH = path.join(OFFLINE_WEISSSCHWARZ_DIR, "cards.json");
const OFFLINE_WEISSSCHWARZ_SETS_PATH = path.join(OFFLINE_WEISSSCHWARZ_DIR, "sets.json");

let offlineWeissSchwarzCards = [];
let offlineWeissSchwarzSets = [];
const offlineWeissSchwarzCardsBySet = new Map();

function loadOfflineWeissSchwarz() {
  try {
    offlineWeissSchwarzCards = [];
    offlineWeissSchwarzSets = [];
    offlineWeissSchwarzCardsBySet.clear();

    if (fs.existsSync(OFFLINE_WEISSSCHWARZ_CARDS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_WEISSSCHWARZ_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) offlineWeissSchwarzCards = parsed;
    } else {
      console.log("📦 No offline Weiss Schwarz cards.json found at", OFFLINE_WEISSSCHWARZ_CARDS_PATH);
    }

    if (fs.existsSync(OFFLINE_WEISSSCHWARZ_SETS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_WEISSSCHWARZ_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) offlineWeissSchwarzSets = parsed;
    } else {
      console.log("📦 No offline Weiss Schwarz sets.json found at", OFFLINE_WEISSSCHWARZ_SETS_PATH);
    }

    for (const c of offlineWeissSchwarzCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;
      if (!offlineWeissSchwarzCardsBySet.has(setId)) {
        offlineWeissSchwarzCardsBySet.set(setId, []);
      }
      offlineWeissSchwarzCardsBySet.get(setId).push(c);
    }

    console.log(`📦 Offline Weiss Schwarz sets: ${offlineWeissSchwarzSets.length}`);
    console.log(`📦 Offline Weiss Schwarz cards: ${offlineWeissSchwarzCards.length}`);
  } catch (e) {
    console.log("Offline Weiss Schwarz load error:", e.message);
  }
}
loadOfflineWeissSchwarz();

const WEISSSCHWARZ_R2_BASE = "https://pub-817aabdb96334b768d7f4520c7ac5481.r2.dev";

function drawOfflineWeissSchwarzCard() {
  if (!offlineWeissSchwarzCards?.length) {
    throw new Error("Offline Weiss Schwarz pool empty");
  }
  const valid = offlineWeissSchwarzCards.filter(c => c?.image);
  if (!valid.length) throw new Error("Weiss Schwarz: no valid images");
  const c = valid[Math.floor(Math.random() * valid.length)];
  return {
    ...c,
    image: `${WEISSSCHWARZ_R2_BASE}/${c.image}`,
    imageHigh: `${WEISSSCHWARZ_R2_BASE}/${c.imageHigh || c.image}`,
  };
}

// =========================
// OFFLINE MAGIC
// =========================
const OFFLINE_MAGIC_DIR        = path.join(__dirname, "data", "magic");
const OFFLINE_MAGIC_CARDS_PATH = path.join(OFFLINE_MAGIC_DIR, "cards.json");
const OFFLINE_MAGIC_SETS_PATH  = path.join(OFFLINE_MAGIC_DIR, "sets.json");

let offlineMagicCards = [];
let offlineMagicSets  = [];
const offlineMagicCardsBySet = new Map();

// URL publique R2 pour les images Magic
const MAGIC_R2_BASE = "https://pub-383a4299f072470d88f0b64b2318b52d.r2.dev/magic";

function rewriteMagicImageUrl(url, cardId) {
  if (!url) return url;

  // si déjà sur R2, on garde
  if (url.startsWith("https://pub-383a4299f072470d88f0b64b2318b52d.r2.dev")) {
    return url;
  }

  // si c'est un chemin local généré, on le convertit vers R2
  const localMatch = url.match(/\/data\/magic\/images\/(.+)$/);
  if (localMatch) {
    return `${MAGIC_R2_BASE}/${localMatch[1]}`;
  }

  // IMPORTANT:
  // si l'image vient de Scryfall, on la garde telle quelle
  // au lieu de la convertir en URL R2
  if (url.includes("scryfall.io") || url.includes("cards.scryfall")) {
    return url;
  }

  return url;
}

function loadOfflineMagic() {
  try {
    offlineMagicCards = [];
    offlineMagicSets  = [];
    offlineMagicCardsBySet.clear();

    if (fs.existsSync(OFFLINE_MAGIC_CARDS_PATH)) {
      const raw    = fs.readFileSync(OFFLINE_MAGIC_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) offlineMagicCards = parsed;
    } else {
      console.log("📦 No offline Magic cards.json found at", OFFLINE_MAGIC_CARDS_PATH);
    }

    if (fs.existsSync(OFFLINE_MAGIC_SETS_PATH)) {
      const raw    = fs.readFileSync(OFFLINE_MAGIC_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) offlineMagicSets = parsed;
    } else {
      console.log("📦 No offline Magic sets.json found at", OFFLINE_MAGIC_SETS_PATH);
    }

    for (const c of offlineMagicCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;
      if (!offlineMagicCardsBySet.has(setId)) {
        offlineMagicCardsBySet.set(setId, []);
      }
      offlineMagicCardsBySet.get(setId).push(c);
    }

    console.log(`📦 Offline Magic sets: ${offlineMagicSets.length}`);
    console.log(`📦 Offline Magic cards: ${offlineMagicCards.length}`);
  } catch (e) {
    console.log("Offline Magic load error:", e.message);
  }
}
loadOfflineMagic();

function drawOfflineMagicCard() {
  if (!offlineMagicCards?.length) {
    throw new Error("Offline Magic pool empty");
  }
  const valid = offlineMagicCards.filter(c => c?.image || c?.imageHigh);
  if (!valid.length) throw new Error("Magic: no valid images");
  const c = valid[Math.floor(Math.random() * valid.length)];
  return {
    ...c,
    image:     rewriteMagicImageUrl(c.imageHigh || c.image, c.cardId),
    imageHigh: rewriteMagicImageUrl(c.imageHigh || c.image, c.cardId),
  };
}

// =========================
// OFFLINE POKEMON CATALOG
// =========================
// ── BRAINROT TCG ─────────────────────────────────────────────
const OFFLINE_BRAINROT_DIR        = path.join(__dirname, "data", "brainrot");
const OFFLINE_BRAINROT_CARDS_PATH = path.join(OFFLINE_BRAINROT_DIR, "cards.json");
const OFFLINE_BRAINROT_SETS_PATH  = path.join(OFFLINE_BRAINROT_DIR, "sets.json");

let offlineBrainrotCards = [];
let offlineBrainrotSets  = [];
const offlineBrainrotCardsBySet = new Map();

function loadOfflineBrainrot() {
  try {
    offlineBrainrotCards = [];
    offlineBrainrotSets  = [];
    offlineBrainrotCardsBySet.clear();
    if (fs.existsSync(OFFLINE_BRAINROT_CARDS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_BRAINROT_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) offlineBrainrotCards = parsed;
    }
    if (fs.existsSync(OFFLINE_BRAINROT_SETS_PATH)) {
      const raw = fs.readFileSync(OFFLINE_BRAINROT_SETS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) offlineBrainrotSets = parsed;
    }
    for (const c of offlineBrainrotCards) {
      const setId = String(c?.setId || "").trim();
      if (!setId) continue;
      if (!offlineBrainrotCardsBySet.has(setId)) offlineBrainrotCardsBySet.set(setId, []);
      offlineBrainrotCardsBySet.get(setId).push(c);
    }
    console.log(`📦 BrainRot sets: ${offlineBrainrotSets.length}, cards: ${offlineBrainrotCards.length}`);
  } catch(e) { console.log("BrainRot load error:", e.message); }
}
loadOfflineBrainrot();

function drawOfflineBrainrotCard() {
  if (!offlineBrainrotCards?.length) throw new Error("BrainRot pool empty");
  const c = offlineBrainrotCards[Math.floor(Math.random() * offlineBrainrotCards.length)];
  return {
    cardId: c.cardId || null, setId: c.setId || null, localId: c.localId || null,
    name: c.name || "Unknown", set: c.set || "BrainRot", rarity: c.rarity || "",
    image: c.image || null, imageHigh: c.imageHigh || c.image || null
  };
}

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

  // grades_json : tableau JSON des grades de chaque exemplaire ex: [3,7,7,5]
  // Permet de calculer le vrai prix de vente par exemplaire (pas le meilleur grade)
  await pool.query(`ALTER TABLE collection ADD COLUMN IF NOT EXISTS grades_json TEXT;`);

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

  // =========================
  // CLANS
  // =========================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clans (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      tag TEXT NOT NULL,
      description TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      banner_color TEXT DEFAULT '#7f5cff',
      leader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      xp BIGINT NOT NULL DEFAULT 0,
      bank BIGINT NOT NULL DEFAULT 0,
      createdAt BIGINT NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_members (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      damage_total BIGINT NOT NULL DEFAULT 0,
      joined_at BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_chat (
      id SERIAL PRIMARY KEY,
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      message TEXT NOT NULL,
      createdAt BIGINT NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_clan_chat_clan ON clan_chat(clan_id, createdAt DESC)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_boss (
      id SERIAL PRIMARY KEY,
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'Démon Obscur',
      hp_max INTEGER NOT NULL DEFAULT 50000,
      hp_current INTEGER NOT NULL DEFAULT 50000,
      reward BIGINT NOT NULL DEFAULT 5000,
      defeated INTEGER NOT NULL DEFAULT 0,
      started_at BIGINT NOT NULL DEFAULT 0,
      defeated_at BIGINT DEFAULT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_boss_damage (
      id SERIAL PRIMARY KEY,
      boss_id INTEGER NOT NULL REFERENCES clan_boss(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      damage INTEGER NOT NULL DEFAULT 0,
      at BIGINT NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_missions (
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mission_key TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      goal INTEGER NOT NULL DEFAULT 1,
      completed INTEGER NOT NULL DEFAULT 0,
      date_key TEXT NOT NULL,
      PRIMARY KEY(clan_id, user_id, mission_key, date_key)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_chest_claimed (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date_key TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_detail TEXT NOT NULL,
      claimed_at BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id, date_key)
    )
  `);
  await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS logo TEXT DEFAULT '';`);
  await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;`);
  await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS talent_points INTEGER NOT NULL DEFAULT 0;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_talents (
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      talent_key TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(clan_id, talent_key)
    )
  `);

  // Nouvelles colonnes pour le système de raid
  await pool.query(`ALTER TABLE clan_boss ADD COLUMN IF NOT EXISTS boss_key TEXT DEFAULT 'arakas'`);
  await pool.query(`ALTER TABLE clan_boss ADD COLUMN IF NOT EXISTS expires_at BIGINT DEFAULT NULL`);
  await pool.query(`ALTER TABLE clan_boss ADD COLUMN IF NOT EXISTS failed INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS last_raid_arakas TEXT DEFAULT NULL`);
  await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS last_raid_myntalis TEXT DEFAULT NULL`);
  await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS last_raid_xenos TEXT DEFAULT NULL`);
  // Stock de dégâts par membre (persist en DB)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clan_raid_stock (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
      boss_id INTEGER NOT NULL REFERENCES clan_boss(id) ON DELETE CASCADE,
      stock INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id, boss_id)
    )
  `);

  // Tables pour le système de cartes de raid
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_raid_cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_key TEXT NOT NULL,
      obtained_at BIGINT NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_raid_deck (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 5),
      card_key TEXT NOT NULL,
      PRIMARY KEY(user_id, slot)
    )
  `);

  // === SYSTÈME PERSONNAGE ===
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_character (
      user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      char_xp   BIGINT NOT NULL DEFAULT 0,
      char_level INTEGER NOT NULL DEFAULT 1,
      stat_force       INTEGER NOT NULL DEFAULT 0,
      stat_agilite     INTEGER NOT NULL DEFAULT 0,
      stat_intelligence INTEGER NOT NULL DEFAULT 0,
      stat_dexterite   INTEGER NOT NULL DEFAULT 0,
      points_available INTEGER NOT NULL DEFAULT 0,
      char_class TEXT DEFAULT NULL
    )
  `);
  await pool.query(`ALTER TABLE player_character ADD COLUMN IF NOT EXISTS char_class TEXT DEFAULT NULL`);

  // Table équipements
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_equipment (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      equip_key TEXT NOT NULL,
      obtained_at BIGINT NOT NULL DEFAULT 0,
      equipped_slot TEXT DEFAULT NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_player_equipment_user ON player_equipment(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pulls_user_game    ON pulls(user_id, game)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pulls_user_at      ON pulls(user_id, at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_collection_user_game  ON collection(user_id, game)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_collection_user_idkey ON collection(user_id, idKey)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS raid_drops_recap (
      id SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      boss_id    INTEGER NOT NULL,
      boss_name  TEXT NOT NULL DEFAULT '',
      boss_key   TEXT NOT NULL DEFAULT '',
      victory    INTEGER NOT NULL DEFAULT 1,
      cards      JSONB NOT NULL DEFAULT '[]'::jsonb,
      equipment  JSONB NOT NULL DEFAULT '[]'::jsonb,
      materials  JSONB NOT NULL DEFAULT '[]'::jsonb,
      char_level_up JSONB DEFAULT NULL,
      seen       INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_raid_drops_recap_user ON raid_drops_recap(user_id, seen)`);

  // PVP
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pvp_battles (
      id           SERIAL PRIMARY KEY,
      challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opponent_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status        TEXT NOT NULL DEFAULT 'pending',
      winner_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      log           JSONB NOT NULL DEFAULT '[]'::jsonb,
      challenger_rank_before INTEGER NOT NULL DEFAULT 1000,
      opponent_rank_before   INTEGER NOT NULL DEFAULT 1000,
      rank_change   INTEGER NOT NULL DEFAULT 0,
      created_at    BIGINT NOT NULL DEFAULT 0,
      accepted_at   BIGINT DEFAULT NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pvp_challenger ON pvp_battles(challenger_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pvp_opponent   ON pvp_battles(opponent_id)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_rank INTEGER NOT NULL DEFAULT 1000`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_wins  INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_losses INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_energy INTEGER DEFAULT 100`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_energy_last_refill BIGINT DEFAULT 0`);
  await pool.query(`UPDATE users SET pvp_energy=100, pvp_energy_last_refill=${Date.now()} WHERE pvp_energy IS NULL OR pvp_energy_last_refill=0`);
  await pool.query(`ALTER TABLE player_equipment ADD COLUMN IF NOT EXISTS forge_level INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_materials (
      user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mat_key  TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id, mat_key)
    )
  `);

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

// ── GRADES JSON helpers ─────────────────────────────────────
// Parse le tableau de grades stocké en DB
function parseGrades(gradesJson, count) {
  try {
    const arr = JSON.parse(gradesJson || "[]");
    if (Array.isArray(arr) && arr.length) return arr.map(Number);
  } catch {}
  // Fallback pour les anciennes cartes sans grades_json : répéter le grade connu
  return Array(Math.max(1, Number(count) || 1)).fill(0);
}

// Calcule le prix total pour vendre qty exemplaires
// On vend en priorité les moins bons grades (sauf si on a le meilleur)
function sellPriceForGrades(gradesArr, qty, mint) {
  // Trier du moins bon au meilleur
  const sorted = [...gradesArr].sort((a, b) => a - b);
  // Prendre les qty premiers (les moins bons)
  const toSell = sorted.slice(0, qty);
  let total = 0;
  for (const g of toSell) {
    total += sellPriceFor(g, mint && g === Math.max(...gradesArr));
  }
  return total;
}

// Retire qty grades du tableau (les moins bons en premier)
function removeGrades(gradesArr, qty) {
  const sorted = [...gradesArr].sort((a, b) => a - b);
  sorted.splice(0, qty);
  return sorted;
}

function sellPriceFor(grade, mint){
  if (mint) return 5;
  const g = Number(grade) || 0;
  if (g >= 10) return 4;
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
  if (g === "weissschwarz") return "weissschwarz";
  if (g === "magic") return "magic";
  if (g === "brainrot") return "brainrot";
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

// ===========================
// SYSTÈME PERSONNAGE
// ===========================

// XP nécessaire pour atteindre un niveau (lvl 1 = 0, lvl 60 = max)
const CHAR_MAX_LEVEL = 60;

// XP total cumulé pour passer du lvl 1 au lvl N
// Courbe progressive : chaque niveau demande 200 * (lvl-1) XP supplémentaires
function charXpForLevel(lvl) {
  lvl = Math.max(1, Math.min(lvl, CHAR_MAX_LEVEL));
  // Somme de 200*(0 + 1 + 2 + ... + (lvl-2)) = 200 * (lvl-1)*(lvl-2)/2
  return lvl <= 1 ? 0 : 100 * (lvl - 1) * (lvl - 2) + 200 * (lvl - 1);
}

function charLevelForXp(xp) {
  xp = Math.max(0, Number(xp) || 0);
  let lvl = 1;
  while (lvl < CHAR_MAX_LEVEL && xp >= charXpForLevel(lvl + 1)) lvl++;
  return lvl;
}

// XP perso gagné par raid vaincu selon le boss
const CHAR_XP_PER_RAID = {
  arakas_easy: 400,
  arakas_hard: 1000,
  myntalis_easy: 2500,
  myntalis_hard: 6000,
  xenos_easy: 15000,
  xenos_hard: 35000,
};

// Récupère ou crée le profil personnage
async function getOrCreateCharacter(userId) {
  const q = await pool.query(`SELECT * FROM player_character WHERE user_id=$1`, [userId]);
  if (q.rows.length) return q.rows[0];
  await pool.query(`INSERT INTO player_character(user_id) VALUES($1) ON CONFLICT DO NOTHING`, [userId]);
  return (await pool.query(`SELECT * FROM player_character WHERE user_id=$1`, [userId])).rows[0];
}

// Ajoute de l'XP perso et gère les montées de niveau
async function addCharXp(userId, xpGain) {
  const char = await getOrCreateCharacter(userId);
  if (Number(char.char_level) >= CHAR_MAX_LEVEL) return char; // déjà max

  const newXp = Number(char.char_xp) + xpGain;
  const newLevel = charLevelForXp(newXp);
  const oldLevel = Number(char.char_level);
  const levelsGained = Math.max(0, newLevel - oldLevel);
  const newPoints = Number(char.points_available) + levelsGained;

  await pool.query(`
    UPDATE player_character
    SET char_xp=$1, char_level=$2, points_available=$3
    WHERE user_id=$4
  `, [newXp, newLevel, newPoints, userId]);

  return { ...char, char_xp: newXp, char_level: newLevel, points_available: newPoints, levelsGained };
}

// Définition des classes, bonus passifs et multiplicateurs de stat
const CHAR_CLASSES = {
  slayer: {
    label: 'Slayer',
    passive_dmg_bonus:   10,
    passive_crit:         0,
    passive_intel_bonus:  0,
    passive_first_attack: 0,
    color: '#ff6464',
    desc: 'Maître du combat direct. +10% DMG permanents.',
    // Multiplicateurs par stat (base × mult = bonus final %)
    scale: { force: 2.0, agilite: 0.8, intelligence: 0.4, dexterite: 1.5 },
    // Stat primaire/secondaire pour affichage
    primary: ['force'],
    secondary: ['dexterite'],
  },
  assassin: {
    label: 'Assassin',
    passive_dmg_bonus:   0,
    passive_crit:        8,
    passive_intel_bonus: 0,
    passive_first_attack: 15,
    color: '#c084ff',
    desc: 'Frappe vite et fort. +8% Crit et +15% 1ère frappe.',
    scale: { force: 0.6, agilite: 2.0, intelligence: 0.5, dexterite: 2.0 },
    primary: ['agilite', 'dexterite'],
    secondary: [],
  },
  soutien: {
    label: 'Soutien',
    passive_dmg_bonus:   5,
    passive_crit:        3,
    passive_intel_bonus: 12,
    passive_first_attack: 0,
    color: '#4da6ff',
    desc: 'Explosif en fin de combat. +12% DMG quand boss < 50% HP.',
    scale: { force: 0.5, agilite: 1.2, intelligence: 2.5, dexterite: 0.8 },
    primary: ['intelligence'],
    secondary: ['agilite'],
  },
};

// Base rate par stat (sans classe)
const STAT_BASE_RATE = { force: 0.5, agilite: 0.4, intelligence: 0.6, dexterite: 0.5 };

// Calcule le multiplicateur effectif d'une stat pour une classe
function statEffectiveRate(statName, charClass) {
  const base = STAT_BASE_RATE[statName] || 0.5;
  const scale = CHAR_CLASSES[charClass]?.scale?.[statName] ?? 1.0;
  return base * scale;
}

// Calcule les bonus de stats perso pour le raid (stats × scale de classe + passif)
function charStatBonus(char, bossHpPct) {
  const force        = Number(char?.stat_force || 0);
  const agilite      = Number(char?.stat_agilite || 0);
  const intelligence = Number(char?.stat_intelligence || 0);
  const dexterite    = Number(char?.stat_dexterite || 0);
  const charClass    = char?.char_class || null;
  const cls          = CHAR_CLASSES[charClass] || null;

  const passive_dmg   = cls?.passive_dmg_bonus   || 0;
  const passive_crit  = cls?.passive_crit         || 0;
  const passive_intel = cls?.passive_intel_bonus  || 0;
  const passive_first = cls?.passive_first_attack || 0;

  return {
    dmg_bonus:    force        * statEffectiveRate('force',        charClass) + passive_dmg,
    crit:         agilite      * statEffectiveRate('agilite',      charClass) + passive_crit,
    clan_dmg:     intelligence * statEffectiveRate('intelligence', charClass) + passive_intel,
    first_attack: dexterite    * statEffectiveRate('dexterite',   charClass) + passive_first,
  };
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

// =========================
// CATALOGUE ÉQUIPEMENTS
// =========================
const EQ_R2 = "https://pub-20dca79c351248edbe98e95c38baaafc.r2.dev";

const EQUIPMENT = {
  // ─── COMMUNS ───
  sword1_c:   { key:'sword1_c',   name:'Épée du Novice',        slot:'weapon', rarity:'common',    image:`${EQ_R2}/commun/sword1.png`,   dmg_bonus:5,  crit:0,  first_attack:0,  clan_dmg:0,  clan_crit:0 },
  dagger1_c:  { key:'dagger1_c',  name:'Dague de Lune',         slot:'weapon', rarity:'common',    image:`${EQ_R2}/commun/dagger1.png`,  dmg_bonus:0,  crit:0,  first_attack:8,  clan_dmg:0,  clan_crit:0 },
  staff1_c:   { key:'staff1_c',   name:'Bâton des Racines',     slot:'weapon', rarity:'common',    image:`${EQ_R2}/commun/staff1.png`,   dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:5,  clan_crit:0 },
  armor1_c:   { key:'armor1_c',   name:'Tunique du Voyageur',   slot:'armor',  rarity:'common',    image:`${EQ_R2}/commun/armor1.png`,   dmg_bonus:0,  crit:4,  first_attack:3,  clan_dmg:0,  clan_crit:0 },
  armor2_c:   { key:'armor2_c',   name:'Robe du Disciple',      slot:'armor',  rarity:'common',    image:`${EQ_R2}/commun/armor2.png`,   dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:4,  clan_crit:3 },
  armor3_c:   { key:'armor3_c',   name:'Plastron de Fer',       slot:'armor',  rarity:'common',    image:`${EQ_R2}/commun/armor3.png`,   dmg_bonus:7,  crit:0,  first_attack:4,  clan_dmg:0,  clan_crit:0 },
  botte1_c:   { key:'botte1_c',   name:'Bottes du Marcheur',    slot:'boots',  rarity:'common',    image:`${EQ_R2}/commun/Botte1.png`,   dmg_bonus:0,  crit:0,  first_attack:3,  clan_dmg:0,  clan_crit:0 },
  botte2_c:   { key:'botte2_c',   name:'Chaussons du Sage',     slot:'boots',  rarity:'common',    image:`${EQ_R2}/commun/botte2.png`,   dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:4,  clan_crit:0 },
  botte3_c:   { key:'botte3_c',   name:'Bottes du Chasseur',    slot:'boots',  rarity:'common',    image:`${EQ_R2}/commun/botte3.png`,   dmg_bonus:0,  crit:3,  first_attack:0,  clan_dmg:0,  clan_crit:0 },
  head1_c:    { key:'head1_c',    name:'Capuche de l\'Ombre',   slot:'head',   rarity:'common',    image:`${EQ_R2}/commun/head1.png`,    dmg_bonus:0,  crit:4,  first_attack:2,  clan_dmg:0,  clan_crit:0 },
  head2_c:    { key:'head2_c',    name:'Chapeau du Mage',       slot:'head',   rarity:'common',    image:`${EQ_R2}/commun/head2.png`,    dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:5,  clan_crit:3 },
  head3_c:    { key:'head3_c',    name:'Heaume du Guerrier',    slot:'head',   rarity:'common',    image:`${EQ_R2}/commun/head3.png`,    dmg_bonus:5,  crit:0,  first_attack:3,  clan_dmg:0,  clan_crit:0 },
  ring1_c:    { key:'ring1_c',    name:'Anneau Brut',           slot:'ring',   rarity:'common',    image:`${EQ_R2}/commun/ring1.png`,    dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:3,  clan_crit:0 },
  ring2_c:    { key:'ring2_c',    name:'Anneau de Clairvoyance',slot:'ring',   rarity:'common',    image:`${EQ_R2}/commun/ring2.png`,    dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:4,  clan_crit:3 },
  ring3_c:    { key:'ring3_c',    name:'Anneau d\'Argent',      slot:'ring',   rarity:'common',    image:`${EQ_R2}/commun/ring3.png`,    dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:2,  clan_crit:3 },

  // ─── RARES ───
  sword1_r:   { key:'sword1_r',   name:'Lame Céleste',          slot:'weapon', rarity:'rare',      image:`${EQ_R2}/rare/sword1.png`,     dmg_bonus:10, crit:0,  first_attack:5,  clan_dmg:0,  clan_crit:0 },
  dagger1_r:  { key:'dagger1_r',  name:'Croc de Jade',          slot:'weapon', rarity:'rare',      image:`${EQ_R2}/rare/dagger1.png`,    dmg_bonus:0,  crit:12, first_attack:6,  clan_dmg:0,  clan_crit:0 },
  staff1_r:   { key:'staff1_r',   name:'Sceptre des Marées',    slot:'weapon', rarity:'rare',      image:`${EQ_R2}/rare/staff1.png`,     dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:9,  clan_crit:5 },
  armor1_r:   { key:'armor1_r',   name:'Veste du Rôdeur',       slot:'armor',  rarity:'rare',      image:`${EQ_R2}/rare/armor1.png`,     dmg_bonus:0,  crit:7,  first_attack:6,  clan_dmg:0,  clan_crit:0 },
  armor2_r:   { key:'armor2_r',   name:'Robe des Anciens',      slot:'armor',  rarity:'rare',      image:`${EQ_R2}/rare/armor2.png`,     dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:8,  clan_crit:6 },
  armor3_r:   { key:'armor3_r',   name:'Cuirasse du Conquérant',slot:'armor',  rarity:'rare',      image:`${EQ_R2}/rare/armor3.png`,     dmg_bonus:12, crit:0,  first_attack:6,  clan_dmg:0,  clan_crit:0 },
  botte1_r:   { key:'botte1_r',   name:'Bottes du Dueliste',    slot:'boots',  rarity:'rare',      image:`${EQ_R2}/rare/botte1r.png`,    dmg_bonus:0,  crit:7,  first_attack:0,  clan_dmg:5,  clan_crit:0 },
  botte2_r:   { key:'botte2_r',   name:'Bottes du Héraut',      slot:'boots',  rarity:'rare',      image:`${EQ_R2}/rare/botte2r.png`,    dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:8,  clan_crit:4 },
  botte3_r:   { key:'botte3_r',   name:'Grèves de Fer Noir',    slot:'boots',  rarity:'rare',      image:`${EQ_R2}/rare/botte3r.png`,    dmg_bonus:10, crit:0,  first_attack:5,  clan_dmg:0,  clan_crit:0 },
  head1_r:    { key:'head1_r',    name:'Masque du Fantôme',     slot:'head',   rarity:'rare',      image:`${EQ_R2}/rare/head1.png`,      dmg_bonus:0,  crit:8,  first_attack:6,  clan_dmg:0,  clan_crit:0 },
  head2_r:    { key:'head2_r',    name:'Capuche du Druide',     slot:'head',   rarity:'rare',      image:`${EQ_R2}/rare/head2.png`,      dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:9,  clan_crit:6 },
  head3_r:    { key:'head3_r',    name:'Heaume du Paladin',     slot:'head',   rarity:'rare',      image:`${EQ_R2}/rare/head3.png`,      dmg_bonus:12, crit:0,  first_attack:5,  clan_dmg:0,  clan_crit:0 },
  ring1_r:    { key:'ring1_r',    name:'Anneau de Feu',         slot:'ring',   rarity:'rare',      image:`${EQ_R2}/rare/ring1.png`,      dmg_bonus:5,  crit:8,  first_attack:0,  clan_dmg:0,  clan_crit:0 },
  ring2_r:    { key:'ring2_r',    name:'Anneau du Crépuscule',  slot:'ring',   rarity:'rare',      image:`${EQ_R2}/rare/ring2.png`,      dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:8,  clan_crit:6 },
  ring3_r:    { key:'ring3_r',    name:'Anneau Mystique',       slot:'ring',   rarity:'rare',      image:`${EQ_R2}/rare/ring3.png`,      dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:5,  clan_crit:7 },

  // ─── ÉPIQUES ───
  sword1_e:   { key:'sword1_e',   name:'Lame des Runes',        slot:'weapon', rarity:'epic',      image:`${EQ_R2}/epic/sword1.png`,     dmg_bonus:18, crit:0,  first_attack:10, clan_dmg:0,  clan_crit:0 },
  dagger1_e:  { key:'dagger1_e',  name:'Pointe de l\'Éclipse',  slot:'weapon', rarity:'epic',      image:`${EQ_R2}/epic/dagger1.png`,    dmg_bonus:0,  crit:20, first_attack:12, clan_dmg:0,  clan_crit:0 },
  staff1_e:   { key:'staff1_e',   name:'Sceptre du Chaos',      slot:'weapon', rarity:'epic',      image:`${EQ_R2}/epic/staff1.png`,     dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:16, clan_crit:10 },
  armor1_e:   { key:'armor1_e',   name:'Manteau de l\'Éclaireur',slot:'armor', rarity:'epic',      image:`${EQ_R2}/epic/armor1.png`,     dmg_bonus:0,  crit:14, first_attack:10, clan_dmg:0,  clan_crit:0 },
  armor2_e:   { key:'armor2_e',   name:'Toge des Abysses',      slot:'armor',  rarity:'epic',      image:`${EQ_R2}/epic/armor2.png`,     dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:15, clan_crit:10 },
  armor3_e:   { key:'armor3_e',   name:'Armure du Titan',       slot:'armor',  rarity:'epic',      image:`${EQ_R2}/epic/armor3.png`,     dmg_bonus:20, crit:0,  first_attack:10, clan_dmg:0,  clan_crit:0 },
  botte1_e:   { key:'botte1_e',   name:'Bottes du Traqueur',    slot:'boots',  rarity:'epic',      image:`${EQ_R2}/epic/botte1.png`,     dmg_bonus:0,  crit:12, first_attack:0,  clan_dmg:8,  clan_crit:0 },
  botte2_e:   { key:'botte2_e',   name:'Bottes de l\'Éclair',   slot:'boots',  rarity:'epic',      image:`${EQ_R2}/epic/botte2.png`,     dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:14, clan_crit:8 },
  botte3_e:   { key:'botte3_e',   name:'Grèves du Colosse',     slot:'boots',  rarity:'epic',      image:`${EQ_R2}/epic/botte3.png`,     dmg_bonus:18, crit:0,  first_attack:8,  clan_dmg:0,  clan_crit:0 },
  head1_e:    { key:'head1_e',    name:'Voile du Néant',        slot:'head',   rarity:'epic',      image:`${EQ_R2}/epic/head1.png`,      dmg_bonus:0,  crit:14, first_attack:10, clan_dmg:0,  clan_crit:0 },
  head2_e:    { key:'head2_e',    name:'Capuche de l\'Arcane',  slot:'head',   rarity:'epic',      image:`${EQ_R2}/epic/head2.png`,      dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:16, clan_crit:10 },
  head3_e:    { key:'head3_e',    name:'Heaume du Suzerain',    slot:'head',   rarity:'epic',      image:`${EQ_R2}/epic/head3.png`,      dmg_bonus:20, crit:0,  first_attack:10, clan_dmg:0,  clan_crit:0 },
  ring1_e:    { key:'ring1_e',    name:'Anneau du Sang',        slot:'ring',   rarity:'epic',      image:`${EQ_R2}/epic/ring1.png`,      dmg_bonus:10, crit:14, first_attack:0,  clan_dmg:0,  clan_crit:0 },
  ring2_e:    { key:'ring2_e',    name:'Anneau des Abysses',    slot:'ring',   rarity:'epic',      image:`${EQ_R2}/epic/ring2.png`,      dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:15, clan_crit:10 },
  ring3_e:    { key:'ring3_e',    name:'Anneau de l\'Œil',      slot:'ring',   rarity:'epic',      image:`${EQ_R2}/epic/ring3.png`,      dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:10, clan_crit:12 },

  // ─── LÉGENDAIRES ───
  sword1_l:   { key:'sword1_l',   name:'Croc du Démon',         slot:'weapon', rarity:'legendary', image:`${EQ_R2}/legendaire/sword1.png`,  dmg_bonus:30, crit:0,  first_attack:18, clan_dmg:0,  clan_crit:0 },
  dagger1_l:  { key:'dagger1_l',  name:'Serres du Néant',       slot:'weapon', rarity:'legendary', image:`${EQ_R2}/legendaire/dagger1.png`, dmg_bonus:0,  crit:35, first_attack:20, clan_dmg:0,  clan_crit:0 },
  staff1_l:   { key:'staff1_l',   name:'Sceptre de l\'Astre',   slot:'weapon', rarity:'legendary', image:`${EQ_R2}/legendaire/staff1.png`,  dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:28, clan_crit:18 },
  armor1_l:   { key:'armor1_l',   name:'Cuirasse de l\'Archange',slot:'armor', rarity:'legendary', image:`${EQ_R2}/legendaire/armor1.png`,  dmg_bonus:0,  crit:25, first_attack:18, clan_dmg:0,  clan_crit:0 },
  armor2_l:   { key:'armor2_l',   name:'Toge de l\'Empereur',   slot:'armor',  rarity:'legendary', image:`${EQ_R2}/legendaire/armor2.png`,  dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:28, clan_crit:18 },
  armor3_l:   { key:'armor3_l',   name:'Armure du Dragon',      slot:'armor',  rarity:'legendary', image:`${EQ_R2}/legendaire/armor3.png`,  dmg_bonus:35, crit:0,  first_attack:18, clan_dmg:0,  clan_crit:0 },
  botte1_l:   { key:'botte1_l',   name:'Bottes du Portail',     slot:'boots',  rarity:'legendary', image:`${EQ_R2}/legendaire/botte1.png`,  dmg_bonus:0,  crit:22, first_attack:0,  clan_dmg:15, clan_crit:0 },
  botte2_l:   { key:'botte2_l',   name:'Bottes de l\'Inferno',  slot:'boots',  rarity:'legendary', image:`${EQ_R2}/legendaire/botte2.png`,  dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:25, clan_crit:15 },
  botte3_l:   { key:'botte3_l',   name:'Sabots de l\'Apocalypse',slot:'boots', rarity:'legendary', image:`${EQ_R2}/legendaire/botte3.png`,  dmg_bonus:32, crit:0,  first_attack:15, clan_dmg:0,  clan_crit:0 },
  head1_l:    { key:'head1_l',    name:'Masque du Seigneur',    slot:'head',   rarity:'legendary', image:`${EQ_R2}/legendaire/head1.png`,   dmg_bonus:0,  crit:25, first_attack:18, clan_dmg:0,  clan_crit:0 },
  head2_l:    { key:'head2_l',    name:'Capuche du Faucheur',   slot:'head',   rarity:'legendary', image:`${EQ_R2}/legendaire/head2.png`,   dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:28, clan_crit:18 },
  head3_l:    { key:'head3_l',    name:'Heaume du Conquérant',  slot:'head',   rarity:'legendary', image:`${EQ_R2}/legendaire/head3.png`,   dmg_bonus:35, crit:0,  first_attack:18, clan_dmg:0,  clan_crit:0 },
  ring1_l:    { key:'ring1_l',    name:'Anneau du Dragon',      slot:'ring',   rarity:'legendary', image:`${EQ_R2}/legendaire/ring1.png`,   dmg_bonus:18, crit:25, first_attack:0,  clan_dmg:0,  clan_crit:0 },
  ring2_l:    { key:'ring2_l',    name:'Anneau de l\'Éternité', slot:'ring',   rarity:'legendary', image:`${EQ_R2}/legendaire/ring2.png`,   dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:28, clan_crit:18 },
  ring3_l:    { key:'ring3_l',    name:'Anneau du Vide',        slot:'ring',   rarity:'legendary', image:`${EQ_R2}/legendaire/ring3.png`,   dmg_bonus:0,  crit:0,  first_attack:0,  clan_dmg:18, clan_crit:22 },
};

// Drop équipement — uniquement sur Myntalis
function randBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

async function dropEquipment(userId, bossKey, difficulty) {
  const allKeys = Object.keys(EQUIPMENT);

  function pickRarity(rarity) {
    const available = allKeys.filter(k => EQUIPMENT[k].rarity === rarity);
    if (!available.length) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  const drops = [];

  if (bossKey === 'arakas') {
    // Arakas : commun garanti + rare 40%
    const common = pickRarity('common');
    if (common) drops.push(common);
    if (Math.random() < 0.40) {
      const rare = pickRarity('rare');
      if (rare) drops.push(rare);
    }
  } else if (bossKey === 'myntalis') {
    // Myntalis : rare garanti + epic 40% + legendary 10%
    const rare = pickRarity('rare');
    if (rare) drops.push(rare);
    if (Math.random() < 0.40) {
      const epic = pickRarity('epic');
      if (epic) drops.push(epic);
    }
    if (Math.random() < 0.10) {
      const leg = pickRarity('legendary');
      if (leg) drops.push(leg);
    }
  } else {
    // Xenos ou autre : tous rarities
    const common = pickRarity('common');
    if (common) drops.push(common);
    if (Math.random() < 0.60) { const rare = pickRarity('rare'); if (rare) drops.push(rare); }
    if (Math.random() < 0.25) { const epic = pickRarity('epic'); if (epic) drops.push(epic); }
    if (Math.random() < 0.08) { const leg  = pickRarity('legendary'); if (leg) drops.push(leg); }
  }

  const now = Date.now();
  for (const key of drops) {
    await pool.query(
      `INSERT INTO player_equipment(user_id, equip_key, obtained_at) VALUES($1,$2,$3)`,
      [userId, key, now]
    );
  }
  return drops.map(k => EQUIPMENT[k]);
}

async function dropMaterials(userId, bossKey, difficulty) {
  // Quantités selon boss + difficulté (100% de drop garanti, seule la quantité varie)
  let drops = []; // [{ matKey, qty }]

  if (bossKey === 'arakas') {
    if (difficulty === 'easy') {
      // 1-10 fer, 1-5 azurite
      drops = [
        { matKey: 'fer',     qty: randBetween(1, 10) },
        { matKey: 'azurite', qty: randBetween(1, 5)  },
      ];
    } else { // hard
      // 1-15 fer, 1-10 azurite
      drops = [
        { matKey: 'fer',     qty: randBetween(1, 15) },
        { matKey: 'azurite', qty: randBetween(1, 10) },
      ];
    }
  } else if (bossKey === 'myntalis') {
    if (difficulty === 'easy') {
      // 1-15 azurite, 1-10 quartz, 1-5 topaze
      drops = [
        { matKey: 'azurite', qty: randBetween(1, 15) },
        { matKey: 'quartz',  qty: randBetween(1, 10) },
        { matKey: 'topaze',  qty: randBetween(1, 5)  },
      ];
    } else { // hard
      // 1-20 azurite, 1-15 quartz, 1-10 topaze
      drops = [
        { matKey: 'azurite', qty: randBetween(1, 20) },
        { matKey: 'quartz',  qty: randBetween(1, 15) },
        { matKey: 'topaze',  qty: randBetween(1, 10) },
      ];
    }
  } else if (bossKey === 'xenos') {
    // Xenos : toutes rarités en grandes quantités
    drops = [
      { matKey: 'fer',     qty: randBetween(5, 20)  },
      { matKey: 'azurite', qty: randBetween(5, 20)  },
      { matKey: 'quartz',  qty: randBetween(3, 15)  },
      { matKey: 'topaze',  qty: randBetween(1, 10)  },
    ];
  }

  for (const { matKey, qty } of drops) {
    await pool.query(`
      INSERT INTO player_materials(user_id, mat_key, quantity) VALUES($1,$2,$3)
      ON CONFLICT(user_id, mat_key) DO UPDATE SET quantity = player_materials.quantity + $3
    `, [userId, matKey, qty]);
  }
  return drops;
}



// ----- PAY LOOP (server-side) -----
const PAY_AMOUNT = 10;
const PAY_EVERY_MS = 15 * 60 * 1000;

// ----- TICKETS -----
const TICKET_AMOUNT   = 1;
const TICKET_EVERY_MS = 1 * 60 * 60 * 1000; // 1 ticket toutes les 1h
const TICKET_CAP      = 999;                  // max 999 tickets stockés

async function applyPayForUser(userId) {
  const { rows } = await pool.query(`SELECT money, lastPay FROM users WHERE id=$1`, [userId]);
  const u = rows[0];
  if (!u) return;

  const now = Date.now();
  const last = Number(u.lastpay ?? u.lastPay ?? 0) || now;
  const delta = Math.max(0, now - last);
  const ticks = Math.floor(delta / PAY_EVERY_MS);

  if (ticks > 0) {
    // Bonus dollax clan
    let payAmount = PAY_AMOUNT;
    try {
      const bonus = await getClanBonusForUser(userId);
      if (bonus) payAmount += bonus.dollaxBonus;
    } catch(e) {}

    const add = ticks * payAmount;
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
  if (tickets >= TICKET_CAP) return;

  const last = Number(u.lastticketpay ?? u.lastTicketPay ?? 0);
  if (last === 0) {
    await pool.query(`UPDATE users SET lastTicketPay=$1 WHERE id=$2`, [now, userId]);
    return;
  }

  // Bonus ticket clan (réduction du cooldown)
  let ticketEvery = TICKET_EVERY_MS;
  try {
    const bonus = await getClanBonusForUser(userId);
    if (bonus) ticketEvery = Math.max(40 * 60 * 1000, TICKET_EVERY_MS - bonus.ticketReduction);
  } catch(e) {}

  const delta = Math.max(0, now - last);
  const ticks = Math.floor(delta / ticketEvery);

  if (ticks > 0) {
    const add     = Math.min(ticks * TICKET_AMOUNT, TICKET_CAP - tickets);
    const newLast = last + ticks * ticketEvery;
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
// MAGIC //
if (game === "magic") {
  const c = drawOfflineMagicCard();
  return {
    cardId:   c.cardId   || null,
    setId:    c.setId    || null,
    localId:  c.localId  || null,
    name:     c.name     || "Unknown",
    set:      c.setName  || "Magic",
    image:    c.image    || null,
    imageHigh: c.imageHigh || c.image || null
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
// WEISS SCHWARZ //
if (game === "weissschwarz") {
  const c = drawOfflineWeissSchwarzCard();
  return {
    cardId: c.cardId || null,
    setId: c.setId || null,
    localId: c.localId || null,
    name: c.name || "",
    set: c.setName || "Weiss Schwarz",
    image: c.image || null,
    imageHigh: c.imageHigh || c.image || null
  };
}
// BRAINROT //
if (game === "brainrot") {
  const c = drawOfflineBrainrotCard();
  console.log("📦 source=OFFLINE_BRAINROT");
  return c;
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
// CLAN LEVEL & TALENTS
// =========================

// XP requis pour chaque niveau de clan
function xpForClanLevel(level) {
  // niveau 1→2: 500 XP, 2→3: 1200 XP, progression exponentielle
  return Math.floor(500 * Math.pow(1.6, level - 1));
}

function clanLevelForXp(xp) {
  let lvl = 1;
  let total = 0;
  while (true) {
    const needed = xpForClanLevel(lvl);
    if (total + needed > xp) break;
    total += needed;
    lvl++;
    if (lvl >= 50) break;
  }
  return lvl;
}

// Définition des talents
const TALENT_DEFS = {
  dollax_bonus: {
    label: "Revenu Dollax",
    description: "Augmente les dollax gagnés toutes les 15min",
    icon: "🪙",
    maxLevel: 10,
    // coût en points par niveau (1,2,3,4,5,6,7,8,9,10)
    costs: [1,2,3,4,5,6,7,8,9,10],
    // bonus par niveau: base=10, +2 par niveau → max = 30
    bonusPerLevel: 2,
    baseValue: 10,
    unit: "dollax/15min",
  },
  ticket_speed: {
    label: "Regen Tickets",
    description: "Réduit le temps entre chaque ticket",
    icon: "🎫",
    maxLevel: 10,
    costs: [1,2,3,4,5,6,7,8,9,10],
    // base=3600000ms (1h), réduit de 8min par niveau → min=40min
    reductionPerLevel: 8 * 60 * 1000,
    baseValue: 60 * 60 * 1000,
    unit: "cooldown",
  },
};

async function getClanTalents(clanId) {
  const { rows } = await pool.query(`SELECT talent_key, level FROM clan_talents WHERE clan_id=$1`, [clanId]);
  const result = {};
  for (const key of Object.keys(TALENT_DEFS)) {
    result[key] = rows.find(r => r.talent_key === key)?.level || 0;
  }
  return result;
}

async function getClanBonusForUser(userId) {
  // Retourne les bonus actifs si le joueur est dans un clan
  try {
    const m = await getMyMembership(userId);
    if (!m) return null;
    const talents = await getClanTalents(m.clan_id);
    const dollaxBonus = talents.dollax_bonus * TALENT_DEFS.dollax_bonus.bonusPerLevel;
    const ticketReduction = talents.ticket_speed * TALENT_DEFS.ticket_speed.reductionPerLevel;
    return { dollaxBonus, ticketReduction, clanId: m.clan_id };
  } catch(e) { return null; }
}

// Vérifier et appliquer le level up du clan après gain XP
async function checkClanLevelUp(clanId) {
  const cQ = await pool.query(`SELECT xp, level, talent_points FROM clans WHERE id=$1`, [clanId]);
  const clan = cQ.rows[0];
  if (!clan) return;

  const newLevel = clanLevelForXp(Number(clan.xp));
  const oldLevel = Number(clan.level);

  if (newLevel > oldLevel) {
    const pointsGained = newLevel - oldLevel;
    await pool.query(`UPDATE clans SET level=$1, talent_points=talent_points+$2 WHERE id=$3`,
      [newLevel, pointsGained, clanId]);
    // Notifier tous les membres
    const members = await pool.query(`SELECT user_id FROM clan_members WHERE clan_id=$1`, [clanId]);
    for (const m of members.rows) {
      await pool.query(
        `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'clan','Clan Level Up !',$2,NULL,0,$3)`,
        [m.user_id, `Votre clan est passé niveau ${newLevel} ! +${pointsGained} point(s) de talent à distribuer.`, Date.now()]
      );
    }
  }
}

// =========================
// CLANS — HELPERS
// =========================

const CLAN_MISSIONS_DEF = [
  { key: "open_cards",   label: "Ouvrir des cartes",         goal: 50, xpClan: 300,  bankReward: 50  },
  { key: "sell_cards",   label: "Vendre des cartes",         goal: 10, xpClan: 200,  bankReward: 40  },
  { key: "buy_market",   label: "Acheter au marché",         goal: 1,  xpClan: 150,  bankReward: 30  },
  { key: "get_mint",     label: "Obtenir une carte MINT",    goal: 1,  xpClan: 150, bankReward: 100 },
  { key: "get_grade10",  label: "Obtenir un grade 10",       goal: 1,  xpClan: 100,  bankReward: 75  },
  { key: "send_message", label: "Envoyer un message clan",   goal: 1,  xpClan: 50,  bankReward: 10  },
  { key: "login_daily",  label: "Se connecter aujourd'hui",  goal: 1,  xpClan: 100,  bankReward: 25  },
  { key: "raid_boss",    label: "Vaincre le boss de raid",   goal: 1,  xpClan: 1000, bankReward: 500 },
];

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

function dmgForCard(grade, mint) {
  let base = 5;
  if (grade >= 10) base = 100;
  else if (grade >= 7) base = 40;
  else if (grade >= 5) base = 20;
  else base = 5;
  return mint ? base * 2 : base;
}

// Définition fixe des boss disponibles (3 boss × 2 difficultés)
const RAID_BOSSES = {
  arakas_easy: {
    key: 'arakas_easy', bossKey: 'arakas',
    name: 'Arakas', difficulty: 'easy', diffLabel: '🟢 Facile',
    image: '/Boss1.gif',
    hp_max: 100000,
    reward: 5000, xpReward: 1000,
    duration: 4 * 60 * 60 * 1000,
    cooldownDays: 1,
  },
  arakas_hard: {
    key: 'arakas_hard', bossKey: 'arakas',
    name: 'Arakas', difficulty: 'hard', diffLabel: '🔴 Hardcore',
    image: '/Boss1.gif',
    hp_max: 100000,
    reward: 10000, xpReward: 2000,
    duration: 1 * 60 * 60 * 1000,
    cooldownDays: 1,
  },
  myntalis_easy: {
    key: 'myntalis_easy', bossKey: 'myntalis',
    name: 'Myntalis', difficulty: 'easy', diffLabel: '🟢 Facile',
    image: '/Boss2.gif',
    hp_max: 500000,
    reward: 20000, xpReward: 4000,
    duration: 4 * 60 * 60 * 1000,
    cooldownDays: 3,
  },
  myntalis_hard: {
    key: 'myntalis_hard', bossKey: 'myntalis',
    name: 'Myntalis', difficulty: 'hard', diffLabel: '🔴 Hardcore',
    image: '/Boss2.gif',
    hp_max: 500000,
    reward: 50000, xpReward: 8000,
    duration: 1 * 60 * 60 * 1000,
    cooldownDays: 3,
  },
  xenos_easy: {
    key: 'xenos_easy', bossKey: 'xenos',
    name: 'Xenos', difficulty: 'easy', diffLabel: '🟢 Facile',
    image: '/Boss3.gif',
    hp_max: 2000000,
    reward: 50000, xpReward: 25000,
    duration: 4 * 60 * 60 * 1000,
    cooldownDays: 7,
  },
  xenos_hard: {
    key: 'xenos_hard', bossKey: 'xenos',
    name: 'Xenos', difficulty: 'hard', diffLabel: '🔴 Hardcore',
    image: '/Boss3.gif',
    hp_max: 2000000,
    reward: 100000, xpReward: 50000,
    duration: 1 * 60 * 60 * 1000,
    cooldownDays: 7,
  },
};

// Retourne la date UTC courante
function todayUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

// Vérifie si le cooldown d'un boss est écoulé
async function checkBossCooldown(clanId, bossKey, cooldownDays) {
  const col = `last_raid_${bossKey}`;
  const cQ = await pool.query(`SELECT ${col} FROM clans WHERE id=$1`, [clanId]);
  const lastDate = cQ.rows[0]?.[col];
  if (!lastDate) return true; // jamais fait

  const last = new Date(lastDate + 'T00:00:00Z');
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return diffDays >= cooldownDays;
}

// Marque un boss comme lancé aujourd'hui
async function markBossCooldown(clanId, bossKey) {
  const col = `last_raid_${bossKey}`;
  await pool.query(`UPDATE clans SET ${col}=$1 WHERE id=$2`, [todayUTC(), clanId]);
}

async function getMyMembership(userId) {
  const r = await pool.query(`SELECT cm.*, c.id as cid FROM clan_members cm JOIN clans c ON c.id=cm.clan_id WHERE cm.user_id=$1`, [userId]);
  return r.rows[0] || null;
}

async function progressMission(clanId, userId, missionKey, amount=1) {
  const dk = todayKey();
  const def = CLAN_MISSIONS_DEF.find(m => m.key === missionKey);
  if (!def) return;

  await pool.query(`
    INSERT INTO clan_missions(clan_id,user_id,mission_key,progress,goal,completed,date_key)
    VALUES($1,$2,$3,0,$4,0,$5)
    ON CONFLICT(clan_id,user_id,mission_key,date_key) DO NOTHING
  `, [clanId, userId, missionKey, def.goal, dk]);

  const upd = await pool.query(`
    UPDATE clan_missions
    SET progress = LEAST(progress + $1, goal)
    WHERE clan_id=$2 AND user_id=$3 AND mission_key=$4 AND date_key=$5 AND completed=0
    RETURNING progress, goal
  `, [amount, clanId, userId, missionKey, dk]);

  if (!upd.rows.length) return;
  const { progress, goal } = upd.rows[0];

  if (progress >= goal) {
    await pool.query(`UPDATE clan_missions SET completed=1 WHERE clan_id=$1 AND user_id=$2 AND mission_key=$3 AND date_key=$4`, [clanId, userId, missionKey, dk]);
    await pool.query(`UPDATE clans SET xp=xp+$1, bank=bank+$2 WHERE id=$3`, [def.xpClan, def.bankReward, clanId]);
    await checkClanLevelUp(clanId).catch(() => {});
    await pool.query(
      `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'clan','Mission clan complétée !',$2,NULL,0,$3)`,
      [userId, `Mission "${def.label}" accomplie ! +${def.xpClan} XP clan, +${def.bankReward} dollax banque.`, Date.now()]
    );
  }
}


async function clanHookOpen(userId, grade, mint) {
  try {
    const m = await getMyMembership(userId);
    if (!m) return;
    await progressMission(m.clan_id, userId, 'open_cards');
    if (mint) await progressMission(m.clan_id, userId, 'get_mint');
    if (grade >= 10) await progressMission(m.clan_id, userId, 'get_grade10');
    // Ajouter dégâts au stock si raid actif
    await _addToRaidStock(m.clan_id, userId, dmgForCard(grade, Boolean(mint)));
  } catch(e) { console.error("clanHookOpen error:", e.message); }
}

// Ajoute des dégâts au stock du joueur si un raid est actif
async function _addToRaidStock(clanId, userId, dmg) {
  const bQ = await pool.query(`SELECT id FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1`, [clanId]);
  if (!bQ.rows.length) return;
  const bossId = bQ.rows[0].id;
  await pool.query(`
    INSERT INTO clan_raid_stock(user_id, clan_id, boss_id, stock) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id, boss_id) DO UPDATE SET stock = clan_raid_stock.stock + $4
  `, [userId, clanId, bossId, dmg]);
}

// Traite plusieurs cartes d'un coup de façon atomique (open x5)
async function clanHookOpenMulti(userId, cards) {
  try {
    const m = await getMyMembership(userId);
    if (!m) return;

    for (const card of cards) {
      await progressMission(m.clan_id, userId, 'open_cards');
      if (card.mint) await progressMission(m.clan_id, userId, 'get_mint');
      if (card.grade >= 10) await progressMission(m.clan_id, userId, 'get_grade10');
    }

    // Ajouter total dégâts au stock
    const totalDmg = cards.reduce((sum, c) => sum + dmgForCard(c.grade, Boolean(c.mint)), 0);
    if (totalDmg > 0) await _addToRaidStock(m.clan_id, userId, totalDmg);
  } catch(e) { console.error("clanHookOpenMulti error:", e.message); }
}


async function clanHookSell(userId, qty) {
  try {
    const m = await getMyMembership(userId);
    if (!m) return;
    for (let i = 0; i < qty; i++) await progressMission(m.clan_id, userId, 'sell_cards');
  } catch(e) {}
}

async function clanHookBuy(userId) {
  try {
    const m = await getMyMembership(userId);
    if (!m) return;
    await progressMission(m.clan_id, userId, 'buy_market');
  } catch(e) {}
}



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

  const clanBonus = await getClanBonusForUser(req.user.id).catch(() => null);
  const payRate = PAY_AMOUNT + (clanBonus?.dollaxBonus || 0);

  res.setHeader('Cache-Control', 'private, max-age=10');
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
    payRate,
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

    // Vérifier si la carte est déjà dans la collection
    const existsQ = await client.query(
      `SELECT 1 FROM collection WHERE user_id=$1 AND idKey=$2`,
      [req.user.id, idKey]
    );
    const isNew = existsQ.rows.length === 0;

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

    // Récupérer le grades_json existant pour l'enrichir
    const existingQ = await client.query(
      `SELECT grades_json, count FROM collection WHERE user_id=$1 AND idKey=$2`,
      [req.user.id, idKey]
    );
    const existingRow = existingQ.rows[0];
    const existingGrades = existingRow
      ? parseGrades(existingRow.grades_json, existingRow.count)
      : [];
    const newGrades = JSON.stringify([...existingGrades, grade]);

    await client.query(
      `
      INSERT INTO collection
        (user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt, grades_json)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$14)
      ON CONFLICT (user_id, idKey)
      DO UPDATE SET
        count = collection.count + 1,
        grade = GREATEST(collection.grade, EXCLUDED.grade),
        mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
        imageHigh = COALESCE(EXCLUDED.imageHigh, collection.imageHigh),
        lastAt = EXCLUDED.lastAt,
        cardId = COALESCE(collection.cardId, EXCLUDED.cardId),
        setId  = COALESCE(collection.setId,  EXCLUDED.setId),
        localId= COALESCE(collection.localId,EXCLUDED.localId),
        grades_json = $14
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
        newGrades,
      ]
    );

    await client.query("COMMIT");

    // Clan hooks (fire and forget)
    clanHookOpen(req.user.id, grade, Boolean(mint)).catch(() => {});

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
        isNew,
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

      const existsQ2 = await client.query(
        `SELECT 1 FROM collection WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey]
      );
      const isNew = existsQ2.rows.length === 0;

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

      // grades_json pour open_multi
      const existingQM = await client.query(
        `SELECT grades_json, count FROM collection WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey]
      );
      const existingRowM = existingQM.rows[0];
      const existingGradesM = existingRowM
        ? parseGrades(existingRowM.grades_json, existingRowM.count)
        : [];
      const newGradesM = JSON.stringify([...existingGradesM, grade]);

      await client.query(
        `
        INSERT INTO collection
          (user_id, idKey, game, cardId, setId, localId, name, setName, image, imageHigh, grade, mint, count, lastAt, grades_json)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$14)
        ON CONFLICT (user_id, idKey)
        DO UPDATE SET
          count = collection.count + 1,
          grade = GREATEST(collection.grade, EXCLUDED.grade),
          mint  = CASE WHEN collection.mint = 1 OR EXCLUDED.mint = 1 THEN 1 ELSE 0 END,
          imageHigh = COALESCE(EXCLUDED.imageHigh, collection.imageHigh),
          lastAt = EXCLUDED.lastAt,
          cardId = COALESCE(collection.cardId, EXCLUDED.cardId),
          setId  = COALESCE(collection.setId,  EXCLUDED.setId),
          localId= COALESCE(collection.localId,EXCLUDED.localId),
          grades_json = $14
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
          now + i,
          newGradesM,
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
        isNew,
        xpAdd
      });
    }

    await client.query(
      `UPDATE users SET xp = xp + $1 WHERE id=$2`,
      [xpTotal, req.user.id]
    );

    await client.query("COMMIT");

    // Clan hook groupé pour toutes les cartes (atomique, évite les race conditions)
    clanHookOpenMulti(req.user.id, pulls).catch(() => {});

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


// Route proxy pour extraction couleurs — contourne le CORS pour collection.html
app.get("/api/foil_colors", auth, async (req, res) => {
  const url = String(req.query.url || "").trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return res.json({ colors: null });
  }
  try {
    const colors = await extractFoilColors(url);
    return res.json({ colors: colors || null });
  } catch {
    return res.json({ colors: null });
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

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    money: me.rows[0]?.money || 0,
    items: items.rows.map((x) => {
  const itemGame = x.game || game;
  const cardId = x.cardid || x.cardId || null;

  const rawImage = x.image;
  const rawImageHigh = x.imagehigh || x.imageHigh || null;

  const image =
    itemGame === "magic"
      ? rewriteMagicImageUrl(rawImage, cardId)
      : rawImage;

  const imageHigh =
    itemGame === "magic"
      ? rewriteMagicImageUrl(rawImageHigh || rawImage, cardId)
      : (rawImageHigh || null);

  return {
    idKey: x.idkey || x.idKey,
    game: itemGame,
    name: x.name,
    set: x.setname || x.setName,
    cardId,
    setId: x.setid || x.setId || null,
    localId: x.localid || x.localId || null,
    image,
    imageHigh,
    grade: x.grade,
    mint: Boolean(x.mint),
    count: x.count,
    lastAt: Number(x.lastat || x.lastAt),
    gradesJson: x.grades_json || null,
  };
})
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

    // ===== MAGIC =====
    if (game === "magic") {

  const bySet = new Map();

  for (const c of offlineMagicCards) {

    const setId = String(c.setId || "").trim();
    const setName = String(c.setName || setId).trim();

    if (!setId) continue;

    if (!bySet.has(setId)) {
      bySet.set(setId, {
        id: setId,
        name: setName
      });
    }
  }

  return res.json({
    sets: Array.from(bySet.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    )
  });

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

    if (game === "weissschwarz") {
      const bySet = new Map();
      for (const c of offlineWeissSchwarzCards) {
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


    if (game === "brainrot") {
      if (offlineBrainrotSets.length)
        return res.json({ sets: offlineBrainrotSets.map(s => ({ id: s.id, name: s.name })) });
      const bySet = new Map();
      for (const c of offlineBrainrotCards) {
        const setId = String(c?.setId || "").trim();
        if (!setId) continue;
        if (!bySet.has(setId)) bySet.set(setId, { id: setId, name: String(c?.set || setId) });
      }
      return res.json({ sets: Array.from(bySet.values()) });
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
    // WEISS SCHWARZ //
    if (game === "weissschwarz") {
      const cards = offlineWeissSchwarzCardsBySet.get(setId) || [];
      return res.json({
        setId,
        cards: cards.map(c => ({
          cardId: c.cardId || "",
          localId: String(c.localId || ""),
          name: c.name || "",
          image: c.image ? `${WEISSSCHWARZ_R2_BASE}/${c.image}` : null,
          imageHigh: c.imageHigh ? `${WEISSSCHWARZ_R2_BASE}/${c.imageHigh}` : (c.image ? `${WEISSSCHWARZ_R2_BASE}/${c.image}` : null)
        }))
      });
    }
    // BRAINROT //
    if (game === "brainrot") {
      const cards = offlineBrainrotCardsBySet.get(setId) || [];
      return res.json({
        setId,
        cards: cards.map(c => ({
          cardId: c.cardId || "", localId: String(c.localId || ""),
          name: c.name || "", image: c.image || null, imageHigh: c.imageHigh || c.image || null
        }))
      });
    }

    // ===== MAGIC =====
    if (game === "magic") {

  const cards = offlineMagicCards
    .filter(c => c.setId === setId)
    .map(c => ({
      cardId: c.cardId,
      localId: c.localId,
      name: c.name,
      image: rewriteMagicImageUrl(c.imageHigh || c.image, c.cardId),
      imageHigh: rewriteMagicImageUrl(c.imageHigh || c.image, c.cardId)
    }));

  return res.json({ setId, cards });

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
    `SELECT game, cardId, name, setName, image, imageHigh, grade, mint, at
     FROM pulls
     WHERE user_id=$1 AND game=$2
     ORDER BY at DESC
     LIMIT 80`,
    [req.user.id, game]
  );

  res.setHeader('Cache-Control', 'private, max-age=15');
  res.json({
    pulls: rows.rows.map((r) => {
      const itemGame = r.game || game;
      const cardId = r.cardid || r.cardId || null;

      const image =
        itemGame === "magic"
          ? rewriteMagicImageUrl(r.image, cardId)
          : r.image;

      const imageHigh =
        itemGame === "magic"
          ? rewriteMagicImageUrl(r.imagehigh || r.imageHigh || r.image, cardId)
          : (r.imagehigh || r.imageHigh || null);

      return {
        name: r.name,
        set: r.setname || r.setName,
        image,
        imageHigh,
        grade: r.grade,
        mint: Boolean(r.mint),
        at: Number(r.at),
      };
    }),
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
      `SELECT count, grade, mint, grades_json FROM collection
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

    // Calcul du prix réel avec les vrais grades de chaque exemplaire
    const gradesArr = parseGrades(it.grades_json, owned);
    const isMint = Number(it.mint) === 1;
    const total = sellPriceForGrades(gradesArr, qty, isMint);
    const unitPrice = Math.round(total / qty); // pour l'affichage

    // Mettre à jour le grades_json en retirant les grades vendus
    const remainingGrades = removeGrades(gradesArr, qty);
    // Le nouveau grade affiché = le meilleur restant
    const newBestGrade = remainingGrades.length ? Math.max(...remainingGrades) : it.grade;

    if (owned === qty) {
      await client.query(
        `DELETE FROM collection WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey]
      );
    } else {
      await client.query(
        `UPDATE collection SET count = count - $3, grades_json = $4, grade = $5 WHERE user_id=$1 AND idKey=$2`,
        [req.user.id, idKey, qty, JSON.stringify(remainingGrades), newBestGrade]
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
      `SELECT idKey, count, grade, mint, grades_json
       FROM collection
       WHERE user_id=$1 AND idKey = ANY($2::text[])
       FOR UPDATE`,
      [req.user.id, keys]
    );

    const byKey = new Map(q.rows.map(r => [r.idkey || r.idKey, r]));

    let total = 0;
    let xpTotal = 0;

    // 1) check + compute totals avec les vrais grades
    for (const it of clean) {
      const row = byKey.get(it.idKey);
      if (!row) continue; // Carte pas en DB → ignorer silencieusement

      const owned = Number(row.count) || 0;
      // Adapter qty au stock réel (évite erreur si désync client/serveur)
      it.qty = Math.min(it.qty, owned);
      if (it.qty <= 0) continue;

      const gradesArr = parseGrades(row.grades_json, owned);
      const isMint = Number(row.mint) === 1;
      const itemTotal = sellPriceForGrades(gradesArr, it.qty, isMint);
      total += itemTotal;
      xpTotal += xpForSell(Math.round(itemTotal / it.qty), it.qty);
    }

    // Filtrer les items avec qty > 0 après ajustement
    const cleanFinal = clean.filter(it => it.qty > 0 && byKey.has(it.idKey));
    if (!cleanFinal.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Aucune carte valide à vendre" });
    }

    // 2) update/remove cards avec mise à jour des grades
    for (const it of cleanFinal) {
      const row = byKey.get(it.idKey);
      const owned = Number(row.count) || 0;
      const gradesArr = parseGrades(row.grades_json, owned);
      const remainingGrades = removeGrades(gradesArr, it.qty);
      const newBestGrade = remainingGrades.length ? Math.max(...remainingGrades) : row.grade;

      if (owned === it.qty) {
        await client.query(
          `DELETE FROM collection WHERE user_id=$1 AND idKey=$2`,
          [req.user.id, it.idKey]
        );
      } else {
        await client.query(
          `UPDATE collection SET count = count - $3, grades_json = $4, grade = $5 WHERE user_id=$1 AND idKey=$2`,
          [req.user.id, it.idKey, it.qty, JSON.stringify(remainingGrades), newBestGrade]
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

    // Clan hook vente
    const totalQty = cleanFinal.reduce((s, it) => s + it.qty, 0);
    clanHookSell(req.user.id, totalQty).catch(() => {});

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
    LIMIT 200
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
// ── /api/market/boot — charge me + clés de collection (allégé) ──
app.get("/api/market/boot", auth, async (req, res) => {
  try {
    // 1. applyPay une seule fois
    await applyPayForUser(req.user.id);
    await applyTicketsForUser(req.user.id);

    // 2. Toutes les requêtes en parallèle
    // ⚡ On ne charge plus que idKey + cardId + count (au lieu de toute la collection)
    //    Le market n'a besoin que de ça pour les filtres "possédée" et le badge vert.
    const [userQ, statsQ, collQ, clanBonus] = await Promise.all([
      pool.query(`SELECT name, money, friendCode, xp, avatar, tickets FROM users WHERE id=$1`, [req.user.id]),
      pool.query(`SELECT COUNT(*)::int AS total,
        SUM(CASE WHEN grade BETWEEN 1 AND 4 THEN 1 ELSE 0 END)::int AS w,
        SUM(CASE WHEN grade BETWEEN 5 AND 6 THEN 1 ELSE 0 END)::int AS b,
        SUM(CASE WHEN grade BETWEEN 7 AND 9 THEN 1 ELSE 0 END)::int AS v,
        SUM(CASE WHEN grade = 10 THEN 1 ELSE 0 END)::int AS g10,
        SUM(CASE WHEN mint = 1 THEN 1 ELSE 0 END)::int AS mint
        FROM pulls WHERE user_id=$1`, [req.user.id]),
      pool.query(`SELECT idKey, cardId, count FROM collection WHERE user_id=$1`, [req.user.id]),
      getClanBonusForUser(req.user.id).catch(() => null),
    ]);

    const u = userQ.rows[0];
    const st = statsQ.rows[0] || {};
    const payRate = PAY_AMOUNT + (clanBonus?.dollaxBonus || 0);

    let friendCode = u?.friendcode || u?.friendCode || null;
    if (!friendCode) {
      friendCode = randFriendCode();
      for (let i = 0; i < 3; i++) {
        try { await pool.query(`UPDATE users SET friendCode=$1 WHERE id=$2`, [friendCode, req.user.id]); break; }
        catch { friendCode = randFriendCode(); }
      }
    }

    // On renvoie uniquement les clés nécessaires aux filtres côté client
    const ownedKeys = collQ.rows.map(x => ({
      idKey: x.idkey || x.idKey,
      cardId: x.cardid || x.cardId || null,
      count: x.count,
    }));

    res.json({
      me: {
        name: u?.name, money: u?.money || 0, friendCode,
        total: st.total || 0, w: st.w || 0, b: st.b || 0, v: st.v || 0,
        g10: st.g10 || 0, mint: st.mint || 0,
        xp: Number(u?.xp || 0), level: levelForXp(u?.xp || 0),
        avatar: u?.avatar || "", tickets: Number(u?.tickets || 0),
        dollax: Number(u?.money || 0), payRate,
      },
      // collection.items est remplacé par ownedKeys, plus léger (~10x moins de données)
      collection: { items: ownedKeys },
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/market", auth, async (req, res) => {
  const q = String(req.query.search || "").toLowerCase().trim();
  const sort = String(req.query.sort || "recent");
  const game = getGame(req);
  const page = Math.max(1, Number(req.query.page || 1) | 0);
  const limit = 50;
  const offset = (page - 1) * limit;

  // Filtres côté serveur
  const mintOnly  = req.query.mintOnly  === "1";
  const hideMine  = req.query.hideMine  === "1";
  const gradeMin  = Math.max(0, Number(req.query.gradeMin  || 0) | 0);
  const priceMax  = Math.max(0, Number(req.query.priceMax  || 0) | 0);

  // hideOwned : sous-requête SQL directe, pas besoin d'envoyer les clés depuis le client
  const hideOwned = req.query.hideOwned === "1";

  const params = [game];
  let where = `WHERE m.game = $1`;

  if (q) {
    params.push(`%${q}%`);
    where += ` AND (LOWER(m.name) LIKE $${params.length} OR LOWER(m.setName) LIKE $${params.length})`;
  }

  if (mintOnly) {
    where += ` AND m.mint = 1`;
  }

  if (hideMine) {
    params.push(req.user.id);
    where += ` AND m.seller_user_id != $${params.length}`;
  }

  if (gradeMin > 0) {
    params.push(gradeMin);
    where += ` AND m.grade >= $${params.length}`;
  }

  if (priceMax > 0) {
    params.push(priceMax);
    where += ` AND m.price <= $${params.length}`;
  }

  if (hideOwned) {
    params.push(req.user.id);
    where += ` AND m.idKey NOT IN (SELECT idKey FROM collection WHERE user_id=$${params.length})`;
  }

  let order = "m.createdAt DESC";
  if (sort === "price") order = "m.price ASC, m.createdAt DESC";
  if (sort === "grade") order = "m.grade DESC, m.createdAt DESC";
  if (sort === "name") order = "m.name ASC, m.createdAt DESC";

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM market_listings m JOIN users u ON u.id = m.seller_user_id ${where}`,
    [...params]
  );
  const total = Number(countRows[0]?.total || 0);
  const totalPages = Math.ceil(total / limit);

  const queryParams = [...params, limit, offset];
  const limitIdx = queryParams.length - 1;
  const offsetIdx = queryParams.length;

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
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `,
    queryParams
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
    page,
    totalPages,
    total,
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
    gameFromKey === "weissschwarz" ? "weissschwarz" :
    gameFromKey === "magic" ? "magic" :
    gameFromKey === "brainrot" ? "brainrot" :
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
      `SELECT id, seller_user_id, idKey, game, cardId, setId, localId, name, setName, image, grade, mint, price, qty
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

    // Clan hook achat
    clanHookBuy(req.user.id).catch(() => {});

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
      `SELECT id, seller_user_id, idKey, game, cardId, setId, localId, name, setName, image, grade, mint, qty
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

  res.setHeader('Cache-Control', 'private, max-age=10');
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
  SELECT u.id, u.name, u.xp, u.avatar, u.friendCode,
         c.tag AS clan_tag, c.name AS clan_name
  FROM users u
  LEFT JOIN clan_members cm ON cm.user_id = u.id
  LEFT JOIN clans c ON c.id = cm.clan_id
  ORDER BY u.xp DESC, u.createdAt ASC, u.id ASC
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
    friendCode: u.friendcode || u.friendCode || "",
    clanTag: u.clan_tag || "",
    clanName: u.clan_name || ""
}));

  res.setHeader('Cache-Control', 'private, max-age=60');
  res.setHeader('Cache-Control', 'private, max-age=60');
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

  const [pQ, oQ, lQ, dQ, uAQ, sGQ, mQ, wSQ] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='pokemon'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='onepiece'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='lorcana'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='dragonball'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='unionarena'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='senpaigodesshaven'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='magic'`, [u.id]),
    pool.query(`SELECT COALESCE(SUM(count),0)::int AS total FROM collection WHERE user_id=$1 AND game='weissschwarz'`, [u.id]),
  ]);

  const pokemon = pQ.rows[0]?.total || 0;
  const onepiece = oQ.rows[0]?.total || 0;
  const lorcana = lQ.rows[0]?.total || 0;
  const dragonball = dQ.rows[0]?.total || 0;
  const unionarena = uAQ.rows[0]?.total || 0;
  const senpaigodesshaven = sGQ.rows[0]?.total || 0;
  const magic = mQ.rows[0]?.total || 0;
  const weissschwarz = wSQ.rows[0]?.total || 0;

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
    magic,
    weissschwarz,
    total: pokemon + onepiece + lorcana + dragonball + unionarena + senpaigodesshaven + magic + weissschwarz
  }
  });
});

// =========================
// CLANS — ROUTES
// =========================

// GET /api/clan/list — liste des clans
app.get("/api/clan/list", auth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.tag, c.description, c.logo, c.banner_color, c.xp, c.bank,
           u.name as leader_name,
           (SELECT COUNT(*) FROM clan_members WHERE clan_id=c.id) as members
    FROM clans c JOIN users u ON u.id=c.leader_id
    ORDER BY c.xp DESC
    LIMIT 50
  `);
  res.json({ clans: rows });
});

// GET /api/clan/me — mon clan (tout en parallèle)
app.get("/api/clan/me", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.json({ clan: null });

  const now = Date.now();

  // Tout en parallèle
  const [cQ, membersQ, bossQ] = await Promise.all([
    pool.query(`SELECT c.*, u.name as leader_name FROM clans c JOIN users u ON u.id=c.leader_id WHERE c.id=$1`, [m.clan_id]),
    pool.query(`SELECT cm.role, cm.damage_total, cm.joined_at, cm.user_id, u.name, u.avatar, u.xp, pc.char_class FROM clan_members cm JOIN users u ON u.id=cm.user_id LEFT JOIN player_character pc ON pc.user_id=cm.user_id WHERE cm.clan_id=$1 ORDER BY cm.damage_total DESC`, [m.clan_id]),
    pool.query(`SELECT * FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1`, [m.clan_id]),
  ]);

  const boss = bossQ.rows[0] || null;
  let bossData = null;

  if (boss) {
    // Fixer expires_at si manquant (anciens boss)
    let expiresAt = boss.expires_at ? Number(boss.expires_at) : null;
    if (!expiresAt && boss.started_at) {
      expiresAt = Number(boss.started_at) + 4 * 60 * 60 * 1000;
      await pool.query(`UPDATE clan_boss SET expires_at=$1 WHERE id=$2`, [expiresAt, boss.id]);
    }

    // Vérifier expiration
    if (expiresAt && now > expiresAt) {
      await pool.query(`UPDATE clan_boss SET failed=1 WHERE id=$1`, [boss.id]);
      bossData = null;
    } else {
      const def = RAID_BOSSES[boss.boss_key] || RAID_BOSSES.arakas;

      // Leaderboard + stock en parallèle
      const [dmgQ, stockQ] = await Promise.all([
        pool.query(`SELECT u.name, SUM(d.damage) as total FROM clan_boss_damage d JOIN users u ON u.id=d.user_id WHERE d.boss_id=$1 GROUP BY u.name ORDER BY total DESC LIMIT 10`, [boss.id]),
        pool.query(`SELECT stock FROM clan_raid_stock WHERE user_id=$1 AND boss_id=$2`, [req.user.id, boss.id]),
      ]);

      bossData = {
        ...boss,
        image: def.image,
        name: def.name,
        expires_at: expiresAt,
        leaderboard: dmgQ.rows,
        myStock: Number(stockQ.rows[0]?.stock || 0),
        timeLeft: expiresAt ? Math.max(0, expiresAt - now) : null,
      };
    }
  }

  res.json({
    clan: cQ.rows[0],
    myRole: m.role,
    members: membersQ.rows,
    boss: bossData,
    availableBosses: !bossData ? Object.values(RAID_BOSSES) : null,
  });
});

// POST /api/clan/create
app.post("/api/clan/create", auth, async (req, res) => {
  const existing = await getMyMembership(req.user.id);
  if (existing) return res.status(400).json({ error: "Tu es déjà dans un clan" });

  const name  = String(req.body?.name || "").trim().slice(0, 30);
  const tag   = String(req.body?.tag  || "").trim().toUpperCase().slice(0, 5);
  const desc  = String(req.body?.description || "").trim().slice(0, 200);
  const color = String(req.body?.banner_color || "#7f5cff").trim();
  const logo  = String(req.body?.logo || "").trim().slice(0, 500);

  if (!name || !tag) return res.status(400).json({ error: "Nom et tag requis" });

  const CLAN_COST = 1000;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Vérifier et déduire les 1000 dollax
    const moneyQ = await client.query(
      `UPDATE users SET money = money - $1 WHERE id=$2 AND money >= $1 RETURNING money`,
      [CLAN_COST, req.user.id]
    );
    if (!moneyQ.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas assez de dollax (1 000 requis)" });
    }

    const cQ = await client.query(`
      INSERT INTO clans(name,tag,description,logo,banner_color,leader_id,xp,bank,createdAt)
      VALUES($1,$2,$3,$4,$5,$6,0,0,$7) RETURNING *
    `, [name, tag, desc, logo, color, req.user.id, Date.now()]);
    const clan = cQ.rows[0];
    await client.query(`INSERT INTO clan_members(user_id,clan_id,role,joined_at) VALUES($1,$2,'leader',$3)`, [req.user.id, clan.id, Date.now()]);
    // Pas de boss automatique — les raids se lancent manuellement
    await client.query("COMMIT");
    res.json({ ok: true, clan });
  } catch(e) {
    await client.query("ROLLBACK");
    if (e.code === '23505') return res.status(400).json({ error: "Ce nom de clan est déjà pris" });
    res.status(500).json({ error: "Erreur serveur" });
  } finally { client.release(); }
});

// POST /api/clan/join
app.post("/api/clan/join", auth, async (req, res) => {
  const existing = await getMyMembership(req.user.id);
  if (existing) return res.status(400).json({ error: "Tu es déjà dans un clan" });

  const clanId = Number(req.body?.clanId) | 0;
  if (!clanId) return res.status(400).json({ error: "clanId manquant" });

  const cQ = await pool.query(`SELECT id FROM clans WHERE id=$1`, [clanId]);
  if (!cQ.rows.length) return res.status(404).json({ error: "Clan introuvable" });

  const count = await pool.query(`SELECT COUNT(*) FROM clan_members WHERE clan_id=$1`, [clanId]);
  if (Number(count.rows[0].count) >= 4) return res.status(400).json({ error: "Clan complet (max 4)" });

  await pool.query(`INSERT INTO clan_members(user_id,clan_id,role,joined_at) VALUES($1,$2,'member',$3)`, [req.user.id, clanId, Date.now()]);
  res.json({ ok: true });
});

// POST /api/clan/leave
app.post("/api/clan/leave", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(400).json({ error: "Tu n'es dans aucun clan" });
  if (m.role === 'leader') return res.status(400).json({ error: "Le meneur doit d'abord transférer la direction" });
  await pool.query(`DELETE FROM clan_members WHERE user_id=$1`, [req.user.id]);
  res.json({ ok: true });
});

// POST /api/clan/kick — meneur/officier seulement
app.post("/api/clan/kick", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || !['leader','officer'].includes(m.role)) return res.status(403).json({ error: "Non autorisé" });

  const targetId = Number(req.body?.userId) | 0;
  if (!targetId || targetId === req.user.id) return res.status(400).json({ error: "Cible invalide" });

  const tQ = await pool.query(`SELECT role FROM clan_members WHERE user_id=$1 AND clan_id=$2`, [targetId, m.clan_id]);
  if (!tQ.rows.length) return res.status(404).json({ error: "Membre introuvable" });
  if (tQ.rows[0].role === 'leader') return res.status(403).json({ error: "Impossible d'exclure le meneur" });

  await pool.query(`DELETE FROM clan_members WHERE user_id=$1 AND clan_id=$2`, [targetId, m.clan_id]);
  res.json({ ok: true });
});

// POST /api/clan/promote
app.post("/api/clan/promote", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || m.role !== 'leader') return res.status(403).json({ error: "Meneur seulement" });

  const targetId = Number(req.body?.userId) | 0;
  const newRole  = String(req.body?.role || "officer");
  if (!['officer','member'].includes(newRole)) return res.status(400).json({ error: "Rôle invalide" });

  await pool.query(`UPDATE clan_members SET role=$1 WHERE user_id=$2 AND clan_id=$3`, [newRole, targetId, m.clan_id]);
  res.json({ ok: true });
});

// POST /api/clan/transfer — transférer la direction
app.post("/api/clan/transfer", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || m.role !== 'leader') return res.status(403).json({ error: "Meneur seulement" });

  const targetId = Number(req.body?.userId) | 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE clan_members SET role='leader' WHERE user_id=$1 AND clan_id=$2`, [targetId, m.clan_id]);
    await client.query(`UPDATE clan_members SET role='officer' WHERE user_id=$1`, [req.user.id]);
    await client.query(`UPDATE clans SET leader_id=$1 WHERE id=$2`, [targetId, m.clan_id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch(e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Erreur" });
  } finally { client.release(); }
});

// POST /api/clan/bank/distribute — distribuer des dollax
app.post("/api/clan/bank/distribute", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || m.role !== 'leader') return res.status(403).json({ error: "Meneur seulement" });

  const targetId = Number(req.body?.userId) | 0;
  const amount   = Math.max(1, Number(req.body?.amount) | 0);

  const cQ = await pool.query(`SELECT bank FROM clans WHERE id=$1 FOR UPDATE`, [m.clan_id]);
  // need transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bankQ = await client.query(`SELECT bank FROM clans WHERE id=$1 FOR UPDATE`, [m.clan_id]);
    if (Number(bankQ.rows[0].bank) < amount) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Banque insuffisante" }); }
    await client.query(`UPDATE clans SET bank=bank-$1 WHERE id=$2`, [amount, m.clan_id]);
    await client.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [amount, targetId]);
    await client.query("COMMIT");
    await pool.query(
      `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'clan','Don du meneur',$2,NULL,0,$3)`,
      [targetId, `Tu as reçu ${amount} dollax de la banque du clan !`, Date.now()]
    );
    res.json({ ok: true });
  } catch(e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Erreur" });
  } finally { client.release(); }
});

// GET /api/clan/chat
app.get("/api/clan/chat", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(403).json({ error: "Non membre" });

  const { rows } = await pool.query(`
    SELECT id, user_id, username, avatar, message, createdAt
    FROM clan_chat WHERE clan_id=$1
    ORDER BY createdAt DESC LIMIT 50
  `, [m.clan_id]);

  res.json({ messages: rows.reverse() });
});

// POST /api/clan/chat
app.post("/api/clan/chat", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(403).json({ error: "Non membre" });

  const message = String(req.body?.message || "").trim().slice(0, 300);
  if (!message) return res.status(400).json({ error: "Message vide" });

  const uQ = await pool.query(`SELECT name, avatar FROM users WHERE id=$1`, [req.user.id]);
  const u = uQ.rows[0];

  await pool.query(`INSERT INTO clan_chat(clan_id,user_id,username,avatar,message,createdAt) VALUES($1,$2,$3,$4,$5,$6)`,
    [m.clan_id, req.user.id, u.name, u.avatar || '', message, Date.now()]);

  // Nettoyer les vieux messages (garder 100 max)
  await pool.query(`DELETE FROM clan_chat WHERE clan_id=$1 AND id NOT IN (SELECT id FROM clan_chat WHERE clan_id=$1 ORDER BY createdAt DESC LIMIT 100)`, [m.clan_id]);

  // Mission chat
  await progressMission(m.clan_id, req.user.id, 'send_message');

  res.json({ ok: true });
});

// GET /api/clan/missions
app.get("/api/clan/missions", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(403).json({ error: "Non membre" });

  const dk = todayKey();
  // Initialiser les missions du jour si pas encore fait
  for (const def of CLAN_MISSIONS_DEF) {
    await pool.query(`
      INSERT INTO clan_missions(clan_id,user_id,mission_key,progress,goal,completed,date_key)
      VALUES($1,$2,$3,0,$4,0,$5)
      ON CONFLICT(clan_id,user_id,mission_key,date_key) DO NOTHING
    `, [m.clan_id, req.user.id, def.key, def.goal, dk]);
  }

  // Mission login_daily — auto-compléter à la connexion
  await progressMission(m.clan_id, req.user.id, 'login_daily');

  const { rows } = await pool.query(`
    SELECT mission_key, progress, goal, completed
    FROM clan_missions WHERE clan_id=$1 AND user_id=$2 AND date_key=$3
  `, [m.clan_id, req.user.id, dk]);

  const missions = CLAN_MISSIONS_DEF.map(def => {
    const row = rows.find(r => r.mission_key === def.key);
    return { ...def, progress: row?.progress || 0, completed: row?.completed || 0 };
  });

  res.json({ missions, dateKey: dk });
});

// GET /api/clan/missions/chest-status
app.get("/api/clan/missions/chest-status", auth, async (req, res) => {
  try {
    const dk = todayKey();
    const q = await pool.query(
      `SELECT reward_type, reward_detail FROM daily_chest_claimed WHERE user_id=$1 AND date_key=$2`,
      [req.user.id, dk]
    );
    res.json({ claimed: q.rows.length > 0, reward: q.rows[0] || null });
  } catch(e) {
    res.json({ claimed: false, reward: null });
  }
});

// POST /api/clan/missions/claim-chest
app.post("/api/clan/missions/claim-chest", auth, async (req, res) => {
  try {
    const m = await getMyMembership(req.user.id);
    if (!m) return res.status(403).json({ error: "Non membre" });

    const dk = todayKey();
    const userId = req.user.id;

    // Déjà réclamé ?
    const alreadyQ = await pool.query(
      `SELECT 1 FROM daily_chest_claimed WHERE user_id=$1 AND date_key=$2`,
      [userId, dk]
    );
    if (alreadyQ.rows.length) {
      return res.status(400).json({ error: "Coffre déjà réclamé aujourd'hui !" });
    }

    // Toutes les missions complétées ?
    const missQ = await pool.query(
      `SELECT COUNT(*) as total, SUM(completed) as done FROM clan_missions WHERE clan_id=$1 AND user_id=$2 AND date_key=$3`,
      [m.clan_id, userId, dk]
    );
    const total = parseInt(missQ.rows[0]?.total || 0);
    const done  = parseInt(missQ.rows[0]?.done  || 0);
    if (total < 8 || done < 8) {
      return res.status(400).json({ error: "Toutes les missions doivent être complétées !" });
    }

    // Loot table (poids sur 100)
    const LOOT_TABLE = [
      { id:'d500',  weight:20, type:'money',     detail:'500',       label:'500 Dollax'            },
      { id:'d1000', weight:15, type:'money',     detail:'1000',      label:'1 000 Dollax'           },
      { id:'cardC', weight:20, type:'card',      detail:'common',    label:'Carte Commune'          },
      { id:'cardR', weight:14, type:'card',      detail:'rare',      label:'Carte Rare'             },
      { id:'cardE', weight:10, type:'card',      detail:'epic',      label:'Carte Épique'           },
      { id:'cardL', weight:3,  type:'card',      detail:'legendary', label:'Carte Légendaire'       },
      { id:'eqC',   weight:10, type:'equipment', detail:'common',    label:'Équipement Commun'      },
      { id:'eqR',   weight:7,  type:'equipment', detail:'rare',      label:'Équipement Rare'        },
      { id:'eqE',   weight:4,  type:'equipment', detail:'epic',      label:'Équipement Épique'      },
      { id:'eqL',   weight:2,  type:'equipment', detail:'legendary', label:'Équipement Légendaire'  },
    ];

    const totalWeight = LOOT_TABLE.reduce((a, l) => a + l.weight, 0);
    let rand = Math.random() * totalWeight;
    let loot = LOOT_TABLE[0];
    for (const l of LOOT_TABLE) { rand -= l.weight; if (rand <= 0) { loot = l; break; } }

    let rewardLabel = loot.label;
    let rewardImage = null;
    let rewardRarity = loot.detail;

    if (loot.type === 'money') {
      const amount = parseInt(loot.detail);
      await pool.query(`UPDATE users SET money = money + $1 WHERE id=$2`, [amount, userId]);
      rewardLabel = `+${amount} Dollax`;

    } else if (loot.type === 'card') {
      // Récupérer les cartes déjà possédées
      const ownedQ = await pool.query(
        `SELECT DISTINCT card_key FROM player_raid_cards WHERE user_id=$1`,
        [userId]
      );
      const ownedKeys = new Set(ownedQ.rows.map(r => r.card_key));

      // Filtrer les cartes de la rareté tirée que le joueur ne possède pas encore
      const allCards = Object.values(RAID_CARDS).filter(c => c.rarity === loot.detail);
      const newCards = allCards.filter(c => !ownedKeys.has(c.key));

      if (newCards.length) {
        // Donner une carte non possédée
        const card = newCards[Math.floor(Math.random() * newCards.length)];
        await pool.query(
          `INSERT INTO player_raid_cards(user_id, card_key, obtained_at) VALUES($1,$2,$3)`,
          [userId, card.key, Date.now()]
        );
        rewardLabel = card.name;
        rewardImage = card.image;
        rewardRarity = card.rarity;
      } else {
        // Toutes les cartes de cette rareté sont déjà possédées → compensation en dollax
        const compensation = loot.detail === 'legendary' ? 1000
                           : loot.detail === 'epic'      ? 500
                           : loot.detail === 'rare'      ? 250
                           : 100;
        await pool.query(`UPDATE users SET money = money + $1 WHERE id=$2`, [compensation, userId]);
        rewardLabel = `+${compensation} Dollax (collection complète !)`;
        rewardImage = null;
        rewardRarity = loot.detail;
        loot = { ...loot, type: 'money' };
      }

    } else if (loot.type === 'equipment') {
      const allEq = Object.values(EQUIPMENT).filter(e => e.rarity === loot.detail);
      if (allEq.length) {
        const eq = allEq[Math.floor(Math.random() * allEq.length)];
        await pool.query(
          `INSERT INTO player_equipment(user_id, equip_key, obtained_at) VALUES($1,$2,$3)`,
          [userId, eq.key, Date.now()]
        );
        rewardLabel = eq.name;
        rewardImage = eq.image;
        rewardRarity = eq.rarity;
      }
    }

    await pool.query(
      `INSERT INTO daily_chest_claimed(user_id, date_key, reward_type, reward_detail, claimed_at) VALUES($1,$2,$3,$4,$5)`,
      [userId, dk, loot.type, loot.detail, Date.now()]
    );

    res.json({ ok: true, reward: { type: loot.type, label: rewardLabel, image: rewardImage, rarity: rewardRarity } });

  } catch(e) {
    console.error("claim-chest error:", e);
    res.status(500).json({ error: "Erreur serveur : " + e.message });
  }
});

// GET /api/clan/raid/mydrops — récap drops non vus
app.get("/api/clan/raid/mydrops", auth, async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT * FROM raid_drops_recap WHERE user_id=$1 AND seen=0 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!q.rows.length) return res.json({ recap: null });
    const row = q.rows[0];
    await pool.query(`UPDATE raid_drops_recap SET seen=1 WHERE id=$1`, [row.id]);
    res.json({
      recap: {
        victory: row.victory === 1,
        bossName: row.boss_name,
        bossKey: row.boss_key,
        cards: row.cards || [],
        equipment: row.equipment || [],
        materials: row.materials || [],
        charLevelUp: row.char_level_up || null,
      }
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/clan/boss — état du raid en cours
app.get("/api/clan/boss", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(403).json({ error: "Non membre" });

  const now = Date.now();
  // Expirer seulement les boss avec expires_at défini
  await pool.query(`UPDATE clan_boss SET failed=1 WHERE clan_id=$1 AND defeated=0 AND failed=0 AND expires_at IS NOT NULL AND expires_at < $2`, [m.clan_id, now]);

  const bQ = await pool.query(`SELECT * FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1`, [m.clan_id]);
  if (!bQ.rows.length) {
    // Calculer les cooldowns par boss
    const clanQ = await pool.query(`SELECT last_raid_arakas, last_raid_myntalis, last_raid_xenos FROM clans WHERE id=$1`, [m.clan_id]);
    const clan = clanQ.rows[0] || {};
    const bossGroups = ['arakas','myntalis','xenos'];
    const cooldowns = {};
    for (const bk of bossGroups) {
      const lastCol = clan[`last_raid_${bk}`];
      if (!lastCol) { cooldowns[bk] = { available: true, daysLeft: 0 }; continue; }
      const last = new Date(lastCol + 'T00:00:00Z');
      const diffDays = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
      const def = Object.values(RAID_BOSSES).find(d => d.bossKey === bk && d.difficulty === 'easy');
      const cooldown = def?.cooldownDays || 1;
      cooldowns[bk] = { available: diffDays >= cooldown, daysLeft: Math.max(0, cooldown - diffDays) };
    }
    return res.json({ boss: null, availableBosses: Object.values(RAID_BOSSES), cooldowns });
  }

  const boss = bQ.rows[0];
  // Fallback image : utilise boss_key si dispo, sinon Boss1.gif par défaut
  const def = RAID_BOSSES[boss.boss_key] || RAID_BOSSES.arakas;
  const bossImage = def.image;
  const bossName = boss.name || def.name;

  // Si ancien boss sans expires_at → on met quand même un timer fictif de 4h depuis started_at
  let expiresAt = boss.expires_at ? Number(boss.expires_at) : null;
  if (!expiresAt && boss.started_at) {
    expiresAt = Number(boss.started_at) + 4 * 60 * 60 * 1000;
    // Sauvegarder pour cohérence
    await pool.query(`UPDATE clan_boss SET expires_at=$1 WHERE id=$2`, [expiresAt, boss.id]);
  }

  const dmgQ = await pool.query(`
    SELECT u.name, SUM(d.damage) as total
    FROM clan_boss_damage d JOIN users u ON u.id=d.user_id
    WHERE d.boss_id=$1 GROUP BY u.name ORDER BY total DESC LIMIT 10
  `, [boss.id]);

  const myDmg = await pool.query(`SELECT COALESCE(SUM(damage),0) as total FROM clan_boss_damage WHERE boss_id=$1 AND user_id=$2`, [boss.id, req.user.id]);

  const stockQ = await pool.query(`SELECT stock FROM clan_raid_stock WHERE user_id=$1 AND boss_id=$2`, [req.user.id, boss.id]);
  const myStock = Number(stockQ.rows[0]?.stock || 0);

  res.json({
    boss: { ...boss, image: bossImage, name: bossName, expires_at: expiresAt },
    leaderboard: dmgQ.rows,
    myDamage: Number(myDmg.rows[0].total),
    myStock,
    timeLeft: expiresAt ? Math.max(0, expiresAt - now) : null,
  });
});

// POST /api/clan/raid/start — lancer un raid (meneur/officier)
app.post("/api/clan/raid/start", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || !['leader','officer'].includes(m.role)) return res.status(403).json({ error: "Meneur ou officier seulement" });

  const bossKey = String(req.body?.bossKey || '');
  const def = RAID_BOSSES[bossKey];
  if (!def) return res.status(400).json({ error: "Boss invalide" });

  // Vérif: pas déjà un raid actif
  const active = await pool.query(`SELECT id FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0`, [m.clan_id]);
  if (active.rows.length) return res.status(400).json({ error: "Un raid est déjà en cours !" });

  // Vérif cooldown par boss (arakas=1j, myntalis=3j, xenos=7j)
  const canStart = await checkBossCooldown(m.clan_id, def.bossKey, def.cooldownDays);
  if (!canStart) {
    const cooldownMsg = def.cooldownDays === 1 ? 'demain' : def.cooldownDays === 3 ? 'dans 3 jours' : 'dans 7 jours';
    return res.status(400).json({ error: `Ce boss est en cooldown. Revenez ${cooldownMsg} !` });
  }

  const now = Date.now();
  const expiresAt = now + def.duration;
  const durationLabel = def.duration >= 4 * 3600000 ? '4h' : '1h';

  const newBoss = await pool.query(`
    INSERT INTO clan_boss(clan_id, name, boss_key, hp_max, hp_current, reward, started_at, expires_at)
    VALUES($1,$2,$3,$4,$4,$5,$6,$7) RETURNING *
  `, [m.clan_id, def.name, def.key, def.hp_max, def.reward, now, expiresAt]);

  await markBossCooldown(m.clan_id, def.bossKey);

  // Notifier les membres
  const members = await pool.query(`SELECT user_id FROM clan_members WHERE clan_id=$1 AND user_id!=$2`, [m.clan_id, req.user.id]);
  for (const mbr of members.rows) {
    await pool.query(
      `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'clan','⚔️ Raid lancé !',$2,NULL,0,$3)`,
      [mbr.user_id, `Raid ${def.diffLabel} contre ${def.name} lancé ! ${durationLabel} pour le vaincre.`, now]
    );
  }

  res.json({ ok: true, boss: newBoss.rows[0] });
});

// POST /api/clan/raid/attack — dépenser son stock de dégâts sur le boss
app.post("/api/clan/raid/attack", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(403).json({ error: "Non membre" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bQ = await client.query(`SELECT * FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1 FOR UPDATE`, [m.clan_id]);
    if (!bQ.rows.length) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Pas de raid actif" }); }

    const boss = bQ.rows[0];

    // Vérif expiration
    if (boss.expires_at && Date.now() > boss.expires_at) {
      await client.query(`UPDATE clan_boss SET failed=1 WHERE id=$1`, [boss.id]);
      await client.query("COMMIT");
      return res.status(400).json({ error: "Le raid a expiré !" });
    }

    // Récupérer le stock
    const stockQ = await client.query(`SELECT stock FROM clan_raid_stock WHERE user_id=$1 AND boss_id=$2 FOR UPDATE`, [req.user.id, boss.id]);
    const stock = Number(stockQ.rows[0]?.stock || 0);
    if (stock <= 0) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Pas de dégâts stockés !" }); }

    // Appliquer les bonus du deck
    const hpPct = Math.round((boss.hp_current / boss.hp_max) * 100);
    const deckBonus = await calcDeckBonus(req.user.id, hpPct, m.clan_id).catch(() => ({ dmg_bonus:0, crit:0, first_attack:0 }));
    const isFirstAttack = stock === Number(stockQ.rows[0]?.stock || 0); // toujours vrai ici = première frappe
    const { dmg: finalDmg, crit: isCrit } = applyDeckToStock(stock, deckBonus, true);

    // Vider le stock
    await client.query(`UPDATE clan_raid_stock SET stock=0 WHERE user_id=$1 AND boss_id=$2`, [req.user.id, boss.id]);

    const newHp = Math.max(0, boss.hp_current - finalDmg);
    await client.query(`UPDATE clan_boss SET hp_current=$1 WHERE id=$2`, [newHp, boss.id]);
    await client.query(`INSERT INTO clan_boss_damage(boss_id,user_id,damage,at) VALUES($1,$2,$3,$4)`, [boss.id, req.user.id, finalDmg, Date.now()]);
    await client.query(`UPDATE clan_members SET damage_total=damage_total+$1 WHERE user_id=$2`, [finalDmg, req.user.id]);

    let defeated = false;
    const def = RAID_BOSSES[boss.boss_key] || RAID_BOSSES.arakas;

    if (newHp <= 0) {
      await client.query(`UPDATE clan_boss SET defeated=1, defeated_at=$1 WHERE id=$2`, [Date.now(), boss.id]);
      await client.query(`DELETE FROM clan_raid_stock WHERE boss_id=$1`, [boss.id]);

      const contributors = await client.query(`SELECT user_id, SUM(damage) as dmg FROM clan_boss_damage WHERE boss_id=$1 GROUP BY user_id ORDER BY dmg DESC`, [boss.id]);
      const nbContribs = contributors.rows.length;

      if (nbContribs > 0) {
        const equalShare = Math.floor(boss.reward / nbContribs);
        const topDmgUserId = contributors.rows[0].user_id;
        const TOP_BONUS = 1000;

        for (const c of contributors.rows) {
          const isTop = c.user_id === topDmgUserId;
          const reward = equalShare + (isTop ? TOP_BONUS : 0);
          await client.query(`UPDATE users SET money=money+$1 WHERE id=$2`, [reward, c.user_id]);
          await client.query(
            `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'clan','🏆 Boss vaincu !',$2,NULL,0,$3)`,
            [c.user_id, `${def.name} vaincu ! Tu reçois ${equalShare} dollax${isTop ? ` + 1 000 dollax (top dégâts) 🏅` : ''}.`, Date.now()]
          );
        }
      }
      await client.query(`UPDATE clans SET xp=xp+$1 WHERE id=$2`, [def.xpReward || 1000, m.clan_id]);
      defeated = true;
    }

    await client.query("COMMIT");

    if (defeated) {
      await checkClanLevelUp(m.clan_id).catch(() => {});
      const contribs = await pool.query(`SELECT DISTINCT user_id FROM clan_boss_damage WHERE boss_id=$1`, [boss.id]);
      const charXpGain = CHAR_XP_PER_RAID[boss.boss_key] || 200;
      for (const c of contribs.rows) {
        await progressMission(m.clan_id, c.user_id, 'raid_boss').catch(() => {});

        // Cartes (arakas + xenos)
        let cardDrops = [];
        if (def.bossKey === 'arakas' || def.bossKey === 'xenos') {
          cardDrops = await dropRaidCards(c.user_id).catch(() => []);
        }

        // Equipements
        let eqDrops = [];
        if (def.bossKey === 'myntalis' || def.bossKey === 'xenos' || def.bossKey === 'arakas') {
          eqDrops = await dropEquipment(c.user_id, def.bossKey, def.difficulty).catch(() => []);
        }

        // Materiaux (100% garanti)
        const matDropsRaw = await dropMaterials(c.user_id, def.bossKey, def.difficulty).catch(() => []);
        const matDropsFmt = matDropsRaw.map(d => ({
          matKey: d.matKey, qty: d.qty,
          name: { fer:'Fer', azurite:'Azurite', quartz:'Quartz', topaze:'Topaze' }[d.matKey] || d.matKey,
          image: `https://raw.githubusercontent.com/skunfy/pok-gacha/main/forge/${d.matKey}.png`,
        }));

        // XP personnage
        const charResult = await addCharXp(c.user_id, charXpGain).catch(() => null);
        let charLevelUp = null;
        if (charResult?.levelsGained > 0) {
          charLevelUp = { level: charResult.char_level, points: charResult.levelsGained };
          await pool.query(
            `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'clan','⬆️ Niveau atteint !',$2,NULL,0,$3)`,
            [c.user_id, `Ton personnage passe au niveau ${charResult.char_level} !`, Date.now()]
          );
        }

        // Stocker le recap pour chaque participant (vu au prochain polling)
        await pool.query(`
          INSERT INTO raid_drops_recap(user_id, boss_id, boss_name, boss_key, victory, cards, equipment, materials, char_level_up, seen, created_at)
          VALUES($1,$2,$3,$4,1,$5,$6,$7,$8,0,$9)
        `, [
          c.user_id, boss.id, def.name || boss.name, def.bossKey || boss.boss_key,
          JSON.stringify(cardDrops), JSON.stringify(eqDrops), JSON.stringify(matDropsFmt),
          charLevelUp ? JSON.stringify(charLevelUp) : null,
          Date.now(),
        ]).catch(() => {});
      }
    }

    const newBossQ = await pool.query(`SELECT * FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1`, [m.clan_id]);
    const dmgQ = await pool.query(`SELECT u.name, SUM(d.damage) as total FROM clan_boss_damage d JOIN users u ON u.id=d.user_id WHERE d.boss_id=$1 GROUP BY u.name ORDER BY total DESC LIMIT 10`, [boss.id]);

    res.json({ ok: true, damage: finalDmg, rawStock: stock, isCrit, defeated, newHp, boss: newBossQ.rows[0] || null, leaderboard: dmgQ.rows });
  } catch(e) {
    await client.query("ROLLBACK");
    console.error("Raid attack error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  } finally { client.release(); }
});



// GET /api/clan/raid/banner — bannière raid pour index et open5
app.get("/api/clan/raid/banner", auth, async (req, res) => {
  try {
    const m = await getMyMembership(req.user.id);
    if (!m) return res.json({ active: false });

    const now = Date.now();
    const bQ = await pool.query(
      `SELECT id, name, boss_key, hp_current, hp_max FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1`,
      [m.clan_id]
    );
    if (!bQ.rows.length) return res.json({ active: false });

    const boss = bQ.rows[0];
    const def = RAID_BOSSES[boss.boss_key] || RAID_BOSSES.arakas;

    const topQ = await pool.query(
      `SELECT u.name, SUM(d.damage) as total
       FROM clan_boss_damage d JOIN users u ON u.id=d.user_id
       WHERE d.boss_id=$1 GROUP BY u.name ORDER BY total DESC LIMIT 3`,
      [boss.id]
    );

    res.json({
      active: true,
      bossName: def.name,
      hpPct: Math.round((boss.hp_current / boss.hp_max) * 100),
      top3: topQ.rows.map(r => ({ name: r.name, total: Number(r.total) })),
    });
  } catch(e) { res.json({ active: false }); }
});

// GET /api/clan/raid/last — dernier raid terminé (vaincu ou échoué)
app.get("/api/clan/raid/last", auth, async (req, res) => {
  try {
    const m = await getMyMembership(req.user.id);
    if (!m) return res.status(403).json({ error: "Non membre" });

    // Dernier raid terminé (defeated=1 ou failed=1)
    const bQ = await pool.query(
      `SELECT * FROM clan_boss WHERE clan_id=$1 AND (defeated=1 OR failed=1) ORDER BY id DESC LIMIT 1`,
      [m.clan_id]
    );
    if (!bQ.rows.length) return res.json({ raid: null });

    const boss = bQ.rows[0];
    const def = RAID_BOSSES[boss.boss_key] || Object.values(RAID_BOSSES)[0];

    // Dégâts par joueur
    const dmgQ = await pool.query(
      `SELECT u.name, u.avatar, SUM(d.damage) as total
       FROM clan_boss_damage d JOIN users u ON u.id=d.user_id
       WHERE d.boss_id=$1 GROUP BY u.name, u.avatar ORDER BY total DESC`,
      [boss.id]
    );

    // Durée du raid (seulement si vaincu)
    let durationMs = null;
    if (Number(boss.defeated) === 1 && boss.defeated_at && boss.started_at) {
      durationMs = Number(boss.defeated_at) - Number(boss.started_at);
    }

    const totalDmg = dmgQ.rows.reduce((acc, r) => acc + Number(r.total), 0);

    res.json({
      raid: {
        bossName:  boss.name || def.name,
        bossKey:   boss.boss_key,
        image:     def.image,
        defeated:  Number(boss.defeated) === 1,
        durationMs,
        startedAt:  Number(boss.started_at),
        defeatedAt: boss.defeated_at ? Number(boss.defeated_at) : null,
        hpMax:   boss.hp_max,
        reward:  boss.reward,
        players: dmgQ.rows.map(r => ({
          name:   r.name,
          avatar: r.avatar,
          total:  Number(r.total),
          pct:    totalDmg > 0 ? Math.round((Number(r.total) / totalDmg) * 100) : 0,
        })),
        totalDmg,
        mvp: dmgQ.rows[0]?.name || null,
      }
    });
  } catch(e) {
    console.error("GET /api/clan/raid/last:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ===========================
// API PERSONNAGE
// ===========================


async function getEquipmentBonus(userId) {
  const { rows } = await pool.query(
    `SELECT equip_key, forge_level FROM player_equipment WHERE user_id=$1 AND equipped_slot IS NOT NULL`,
    [userId]
  );

  let dmg_bonus = 0, crit = 0, first_attack = 0, clan_dmg = 0, clan_crit = 0;
  for (const r of rows) {
    const eq = EQUIPMENT[r.equip_key];
    if (!eq) continue;
    // Appliquer le multiplicateur de forge (+10% par niveau)
    const forgeMult = 1 + ((r.forge_level || 0) * 0.10);
    dmg_bonus    += Math.round((eq.dmg_bonus    || 0) * forgeMult * 10) / 10;
    crit         += Math.round((eq.crit         || 0) * forgeMult * 10) / 10;
    first_attack += Math.round((eq.first_attack || 0) * forgeMult * 10) / 10;
    clan_dmg     += Math.round((eq.clan_dmg     || 0) * forgeMult * 10) / 10;
    clan_crit    += Math.round((eq.clan_crit    || 0) * forgeMult * 10) / 10;
  }
  return { dmg_bonus, crit, first_attack, clan_dmg, clan_crit };
}

// GET /api/character — profil perso de l'utilisateur connecté
app.get("/api/character", auth, async (req, res) => {
  try {
    const char = await getOrCreateCharacter(req.user.id);
    const lvl  = Number(char.char_level);
    const xp   = Number(char.char_xp);
    const xpCurrent = xp - charXpForLevel(lvl);
    const xpNext = lvl < CHAR_MAX_LEVEL ? charXpForLevel(lvl + 1) - charXpForLevel(lvl) : 0;
    const charClass = char.char_class || null;
    const cls = CHAR_CLASSES[charClass] || null;

    // Taux effectif par stat selon la classe
    const rates = {
      force:        statEffectiveRate('force',        charClass),
      agilite:      statEffectiveRate('agilite',      charClass),
      intelligence: statEffectiveRate('intelligence', charClass),
      dexterite:    statEffectiveRate('dexterite',    charClass),
    };

    // Bonus d'équipement
    const eqBonus = await getEquipmentBonus(req.user.id);

    // Bonus stats perso
    const statDmg        = Number(char.stat_force)        * rates.force;
    const statCrit       = Number(char.stat_agilite)      * rates.agilite;
    const statIntel      = Number(char.stat_intelligence) * rates.intelligence;
    const statFirstAtk   = Number(char.stat_dexterite)    * rates.dexterite;

    // Total cumulé (stats + passif classe + équipement)
    const totalBonus = {
      dmg_bonus:    Math.round((statDmg    + (cls?.passive_dmg_bonus   || 0) + eqBonus.dmg_bonus)    * 10) / 10,
      crit:         Math.round((statCrit   + (cls?.passive_crit        || 0) + eqBonus.crit)          * 10) / 10,
      clan_dmg:     Math.round((statIntel  + (cls?.passive_intel_bonus || 0) + eqBonus.clan_dmg)      * 10) / 10,
      first_attack: Math.round((statFirstAtk + (cls?.passive_first_attack || 0) + eqBonus.first_attack) * 10) / 10,
      clan_crit:    Math.round(eqBonus.clan_crit * 10) / 10,
    };

    res.json({
      char_level: lvl,
      char_xp:    xp,
      xp_current_level: xpCurrent,
      xp_for_next:      xpNext,
      xp_pct: xpNext > 0 ? Math.min(100, Math.round((xpCurrent / xpNext) * 100)) : 100,
      stat_force:        Number(char.stat_force),
      stat_agilite:      Number(char.stat_agilite),
      stat_intelligence: Number(char.stat_intelligence),
      stat_dexterite:    Number(char.stat_dexterite),
      points_available:  Number(char.points_available),
      max_level: CHAR_MAX_LEVEL,
      char_class: charClass,
      class_label: cls?.label || null,
      class_color: cls?.color || null,
      class_desc:  cls?.desc  || null,
      class_primary:   cls?.primary   || [],
      class_secondary: cls?.secondary || [],
      stat_rates: rates,
      class_passive: cls ? {
        dmg_bonus:    cls.passive_dmg_bonus,
        crit:         cls.passive_crit,
        clan_dmg:     cls.passive_intel_bonus,
        first_attack: cls.passive_first_attack,
      } : null,
      classes_def: CHAR_CLASSES,
      equipment_bonus: eqBonus,
      total_bonus: totalBonus,
      bonus_preview: {
        dmg_bonus:    statDmg    + (cls?.passive_dmg_bonus   || 0),
        crit:         statCrit   + (cls?.passive_crit        || 0),
        clan_dmg:     statIntel  + (cls?.passive_intel_bonus || 0),
        first_attack: statFirstAtk + (cls?.passive_first_attack || 0),
      }
    });
  } catch(e) {
    console.error("GET /api/character:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/character/class — choisir ou changer de classe
app.post("/api/character/class", auth, async (req, res) => {
  const CLASS_CHANGE_COST = 1000; // dollax pour changer (gratuit si pas encore de classe)
  const newClass = req.body?.char_class;
  if (!CHAR_CLASSES[newClass]) return res.status(400).json({ error: "Classe invalide" });

  try {
    const char = await getOrCreateCharacter(req.user.id);
    const alreadyHasClass = !!char.char_class;

    if (alreadyHasClass && char.char_class === newClass) {
      return res.status(400).json({ error: "Tu as déjà cette classe" });
    }

    if (alreadyHasClass) {
      // Coût de changement
      const userQ = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
      const money = Number(userQ.rows[0]?.money || 0);
      if (money < CLASS_CHANGE_COST) {
        return res.status(400).json({ error: `Changer de classe coûte ${CLASS_CHANGE_COST} dollax` });
      }
      await pool.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [CLASS_CHANGE_COST, req.user.id]);
    }

    await pool.query(`UPDATE player_character SET char_class=$1 WHERE user_id=$2`, [newClass, req.user.id]);
    res.json({ ok: true, char_class: newClass, cost: alreadyHasClass ? CLASS_CHANGE_COST : 0 });
  } catch(e) {
    console.error("POST /api/character/class:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/character/allocate — dépenser un point dans une stat
app.post("/api/character/allocate", auth, async (req, res) => {
  const stat = req.body?.stat;
  const validStats = ['stat_force', 'stat_agilite', 'stat_intelligence', 'stat_dexterite'];
  if (!validStats.includes(stat)) return res.status(400).json({ error: "Stat invalide" });

  try {
    const char = await getOrCreateCharacter(req.user.id);
    if (Number(char.points_available) < 1) return res.status(400).json({ error: "Pas de points disponibles" });

    await pool.query(
      `UPDATE player_character SET ${stat}=${stat}+1, points_available=points_available-1 WHERE user_id=$1`,
      [req.user.id]
    );
    const updated = await pool.query(`SELECT * FROM player_character WHERE user_id=$1`, [req.user.id]);
    const c = updated.rows[0];
    res.json({
      ok: true,
      stat,
      new_value: Number(c[stat]),
      points_available: Number(c.points_available),
    });
  } catch(e) {
    console.error("POST /api/character/allocate:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/character/reset — réinitialiser les stats (coût : 500 dollax)
app.post("/api/character/reset", auth, async (req, res) => {
  const RESET_COST = 500;
  try {
    const char = await getOrCreateCharacter(req.user.id);
    const userQ = await pool.query(`SELECT money FROM users WHERE id=$1`, [req.user.id]);
    const money = Number(userQ.rows[0]?.money || 0);
    if (money < RESET_COST) return res.status(400).json({ error: `Reset coûte ${RESET_COST} dollax` });

    const totalStats = Number(char.stat_force) + Number(char.stat_agilite) + Number(char.stat_intelligence) + Number(char.stat_dexterite);
    const totalPoints = totalStats + Number(char.points_available);

    await pool.query(`UPDATE users SET money=money-$1 WHERE id=$2`, [RESET_COST, req.user.id]);
    await pool.query(`
      UPDATE player_character
      SET stat_force=0, stat_agilite=0, stat_intelligence=0, stat_dexterite=0, points_available=$1
      WHERE user_id=$2
    `, [totalPoints, req.user.id]);

    res.json({ ok: true, points_available: totalPoints, cost: RESET_COST });
  } catch(e) {
    console.error("POST /api/character/reset:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/clan/leaderboard
app.get("/api/clan/leaderboard", auth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.tag, c.xp, c.level, c.banner_color,
           (SELECT COUNT(*) FROM clan_members WHERE clan_id=c.id) as members,
           u.name as leader_name
    FROM clans c JOIN users u ON u.id=c.leader_id
    ORDER BY c.xp DESC LIMIT 20
  `);
  res.json({ clans: rows });
});

// GET /api/clan/talents — talents du clan + infos niveau
app.get("/api/clan/talents", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.status(403).json({ error: "Non membre" });

  const cQ = await pool.query(`SELECT xp, level, talent_points FROM clans WHERE id=$1`, [m.clan_id]);
  const clan = cQ.rows[0];

  const talents = await getClanTalents(m.clan_id);

  const currentLevel = Number(clan.level);
  const nextLevelXp = xpForClanLevel(currentLevel);
  let xpIntoLevel = Number(clan.xp);
  for (let i = 1; i < currentLevel; i++) xpIntoLevel -= xpForClanLevel(i);

  const talentDefs = Object.entries(TALENT_DEFS).map(([key, def]) => ({
    key,
    ...def,
    currentLevel: talents[key] || 0,
    costNext: def.costs[talents[key] || 0] || null,
    maxReached: (talents[key] || 0) >= def.maxLevel,
    currentBonus: key === 'dollax_bonus'
      ? `+${(talents[key] || 0) * def.bonusPerLevel} dollax/15min`
      : `Cooldown: ${Math.round((def.baseValue - (talents[key] || 0) * def.reductionPerLevel) / 60000)}min`,
    nextBonus: (talents[key] || 0) < def.maxLevel ? (
      key === 'dollax_bonus'
        ? `+${((talents[key] || 0) + 1) * def.bonusPerLevel} dollax/15min`
        : `Cooldown: ${Math.round((def.baseValue - ((talents[key] || 0) + 1) * def.reductionPerLevel) / 60000)}min`
    ) : null,
  }));

  res.json({
    clanLevel: currentLevel,
    talentPoints: Number(clan.talent_points),
    xpIntoLevel: Math.max(0, xpIntoLevel),
    nextLevelXp,
    talents: talentDefs,
    myRole: m.role,
  });
});

// POST /api/clan/talents/upgrade — dépenser un point de talent (meneur/officier)
app.post("/api/clan/talents/upgrade", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || !['leader','officer'].includes(m.role)) return res.status(403).json({ error: "Meneur ou officier seulement" });

  const key = String(req.body?.key || "");
  const def = TALENT_DEFS[key];
  if (!def) return res.status(400).json({ error: "Talent invalide" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cQ = await client.query(`SELECT talent_points FROM clans WHERE id=$1 FOR UPDATE`, [m.clan_id]);
    const points = Number(cQ.rows[0].talent_points);

    const tQ = await client.query(`SELECT level FROM clan_talents WHERE clan_id=$1 AND talent_key=$2`, [m.clan_id, key]);
    const currentTalentLevel = tQ.rows[0]?.level || 0;

    if (currentTalentLevel >= def.maxLevel) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Niveau maximum atteint" });
    }

    const cost = def.costs[currentTalentLevel];
    if (points < cost) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Pas assez de points (${cost} requis)` });
    }

    await client.query(`UPDATE clans SET talent_points=talent_points-$1 WHERE id=$2`, [cost, m.clan_id]);
    await client.query(`
      INSERT INTO clan_talents(clan_id, talent_key, level) VALUES($1,$2,1)
      ON CONFLICT(clan_id, talent_key) DO UPDATE SET level=clan_talents.level+1
    `, [m.clan_id, key]);

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch(e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Erreur serveur" });
  } finally { client.release(); }
});

// =========================
// CARTES DE RAID
// =========================


const DECK_R2 = "https://pub-027debf53a354fc0ba5821eb8ebb73c9.r2.dev";

const RAID_CARDS = {
  // ⚔️ SLAYER
  slayer_1:  { key:'slayer_1',  name:'Lame Brute',          type:'slayer',  rarity:'common',    image:`${DECK_R2}/slayer_1.png`,  dmg_bonus:5,  crit:0,  first_attack:0,  hp_threshold:null, hp_above:false, team_synergy:null },
  slayer_2:  { key:'slayer_2',  name:'Rage Primaire',        type:'slayer',  rarity:'common',    image:`${DECK_R2}/slayer_2.png`,  dmg_bonus:4,  crit:3,  first_attack:0,  hp_threshold:null, hp_above:false, team_synergy:null },
  slayer_3:  { key:'slayer_3',  name:'Frappe Lourde',        type:'slayer',  rarity:'common',    image:`${DECK_R2}/slayer_3.png`,  dmg_bonus:7,  crit:0,  first_attack:0,  hp_threshold:50,   hp_above:true,  team_synergy:null },
  slayer_4:  { key:'slayer_4',  name:'Instinct Guerrier',    type:'slayer',  rarity:'common',    image:`${DECK_R2}/slayer_4.png`,  dmg_bonus:3,  crit:0,  first_attack:4,  hp_threshold:null, hp_above:false, team_synergy:null },
  slayer_5:  { key:'slayer_5',  name:'Exécuteur',            type:'slayer',  rarity:'rare',      image:`${DECK_R2}/slayer_5.png`,  dmg_bonus:10, crit:0,  first_attack:0,  hp_threshold:50,   hp_above:true,  team_synergy:null },
  slayer_6:  { key:'slayer_6',  name:'Brise-Armure',         type:'slayer',  rarity:'rare',      image:`${DECK_R2}/slayer_6.png`,  dmg_bonus:8,  crit:0,  first_attack:0,  hp_threshold:null, hp_above:false, team_synergy:'slayer_dmg_3' },
  slayer_7:  { key:'slayer_7',  name:'Sang-Froid',           type:'slayer',  rarity:'rare',      image:`${DECK_R2}/slayer_7.png`,  dmg_bonus:6,  crit:6,  first_attack:0,  hp_threshold:null, hp_above:false, team_synergy:null },
  slayer_8:  { key:'slayer_8',  name:'Cyclone de Lames',     type:'slayer',  rarity:'rare',      image:`${DECK_R2}/slayer_8.png`,  dmg_bonus:0,  crit:0,  first_attack:12, hp_threshold:null, hp_above:false, team_synergy:null },
  slayer_9:  { key:'slayer_9',  name:'Déchireur',            type:'slayer',  rarity:'epic',      image:`${DECK_R2}/slayer_9.png`,  dmg_bonus:15, crit:0,  first_attack:0,  hp_threshold:50,   hp_above:true,  team_synergy:null },
  slayer_10: { key:'slayer_10', name:'Fureur Sauvage',       type:'slayer',  rarity:'epic',      image:`${DECK_R2}/slayer_10.png`, dmg_bonus:10, crit:8,  first_attack:0,  hp_threshold:null, hp_above:false, team_synergy:null },
  slayer_11: { key:'slayer_11', name:'Lame du Néant',        type:'slayer',  rarity:'epic',      image:`${DECK_R2}/slayer_11.png`, dmg_bonus:6,  crit:0,  first_attack:15, hp_threshold:50,   hp_above:true,  team_synergy:null },
  slayer_12: { key:'slayer_12', name:'Dévastateur Éternel',  type:'slayer',  rarity:'legendary', image:`${DECK_R2}/slayer_12.png`, dmg_bonus:18, crit:24, first_attack:0,  hp_threshold:50,   hp_above:true,  team_synergy:null },

  // 🛡️ SOUTIEN
  soutien_1:  { key:'soutien_1',  name:'Bouclier Fragile',      type:'soutien', rarity:'common',    image:`${DECK_R2}/soutien_1.png`,  dmg_bonus:0,   crit:0,   first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'ally_dmg_2' },
  soutien_2:  { key:'soutien_2',  name:'Cri de Guerre',          type:'soutien', rarity:'common',    image:`${DECK_R2}/soutien_2.png`,  dmg_bonus:1.5, crit:0,   first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'clan_dmg' },
  soutien_3:  { key:'soutien_3',  name:'Présence Apaisante',     type:'soutien', rarity:'common',    image:`${DECK_R2}/soutien_3.png`,  dmg_bonus:0,   crit:1.5, first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'clan_crit' },
  soutien_4:  { key:'soutien_4',  name:'Aura Protectrice',       type:'soutien', rarity:'common',    image:`${DECK_R2}/soutien_4.png`,  dmg_bonus:0,   crit:0,   first_attack:2.5, hp_threshold:null, hp_above:false, team_synergy:'clan_first_attack' },
  soutien_5:  { key:'soutien_5',  name:'Stratège',               type:'soutien', rarity:'rare',      image:`${DECK_R2}/soutien_5.png`,  dmg_bonus:3,   crit:0,   first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'clan_dmg' },
  soutien_6:  { key:'soutien_6',  name:'Amplificateur',          type:'soutien', rarity:'rare',      image:`${DECK_R2}/soutien_6.png`,  dmg_bonus:0,   crit:2.5, first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'clan_crit_2soutien' },
  soutien_7:  { key:'soutien_7',  name:'Bannière de Gloire',     type:'soutien', rarity:'rare',      image:`${DECK_R2}/soutien_7.png`,  dmg_bonus:4,   crit:0,   first_attack:0,   hp_threshold:50,   hp_above:false, team_synergy:'clan_dmg_low_hp' },
  soutien_8:  { key:'soutien_8',  name:'Écho de Puissance',      type:'soutien', rarity:'rare',      image:`${DECK_R2}/soutien_8.png`,  dmg_bonus:2.5, crit:0,   first_attack:2.5, hp_threshold:null, hp_above:false, team_synergy:'clan_dmg_and_first' },
  soutien_9:  { key:'soutien_9',  name:'Grand Stratège',         type:'soutien', rarity:'epic',      image:`${DECK_R2}/soutien_9.png`,  dmg_bonus:5,   crit:0,   first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'clan_dmg' },
  soutien_10: { key:'soutien_10', name:'Aura de Domination',     type:'soutien', rarity:'epic',      image:`${DECK_R2}/soutien_10.png`, dmg_bonus:2.5, crit:3.5, first_attack:0,   hp_threshold:30,   hp_above:false, team_synergy:'clan_dmg_low_hp' },
  soutien_11: { key:'soutien_11', name:'Lien Sacré',             type:'soutien', rarity:'epic',      image:`${DECK_R2}/soutien_11.png`, dmg_bonus:4,   crit:0,   first_attack:0,   hp_threshold:null, hp_above:false, team_synergy:'clan_dmg_slayer_assassin' },
  soutien_12: { key:'soutien_12', name:"Gardien de l'Alliance",  type:'soutien', rarity:'legendary', image:`${DECK_R2}/soutien_12.png`, dmg_bonus:6,   crit:2.5, first_attack:0,   hp_threshold:20,   hp_above:false, team_synergy:'clan_dmg_low_hp' },

  // 🗡️ ASSASSIN
  assassin_1:  { key:'assassin_1',  name:'Frappe Éclair',        type:'assassin', rarity:'common',    image:`${DECK_R2}/assassin_1.png`,  dmg_bonus:0,  crit:0,  first_attack:8,  hp_threshold:null, hp_above:false, team_synergy:null },
  assassin_2:  { key:'assassin_2',  name:'Ombre Furtive',        type:'assassin', rarity:'common',    image:`${DECK_R2}/assassin_2.png`,  dmg_bonus:4,  crit:0,  first_attack:4,  hp_threshold:null, hp_above:false, team_synergy:null },
  assassin_3:  { key:'assassin_3',  name:'Lame Empoisonnée',     type:'assassin', rarity:'common',    image:`${DECK_R2}/assassin_3.png`,  dmg_bonus:4,  crit:3,  first_attack:0,  hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_4:  { key:'assassin_4',  name:'Instinct Chasseur',    type:'assassin', rarity:'common',    image:`${DECK_R2}/assassin_4.png`,  dmg_bonus:6,  crit:0,  first_attack:0,  hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_5:  { key:'assassin_5',  name:'Frappe Mortelle',      type:'assassin', rarity:'rare',      image:`${DECK_R2}/assassin_5.png`,  dmg_bonus:0,  crit:6,  first_attack:10, hp_threshold:null, hp_above:false, team_synergy:null },
  assassin_6:  { key:'assassin_6',  name:'Danse des Lames',      type:'assassin', rarity:'rare',      image:`${DECK_R2}/assassin_6.png`,  dmg_bonus:8,  crit:0,  first_attack:8,  hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_7:  { key:'assassin_7',  name:'Ombre Tranchante',     type:'assassin', rarity:'rare',      image:`${DECK_R2}/assassin_7.png`,  dmg_bonus:0,  crit:12, first_attack:0,  hp_threshold:null, hp_above:false, team_synergy:'crit_if_soutien' },
  assassin_8:  { key:'assassin_8',  name:'Venin Corrosif',       type:'assassin', rarity:'rare',      image:`${DECK_R2}/assassin_8.png`,  dmg_bonus:10, crit:0,  first_attack:0,  hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_9:  { key:'assassin_9',  name:'Exécution Parfaite',   type:'assassin', rarity:'epic',      image:`${DECK_R2}/assassin_9.png`,  dmg_bonus:0,  crit:8,  first_attack:15, hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_10: { key:'assassin_10', name:'Lame Fantôme',         type:'assassin', rarity:'epic',      image:`${DECK_R2}/assassin_10.png`, dmg_bonus:12, crit:6,  first_attack:0,  hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_11: { key:'assassin_11', name:'Rupture',              type:'assassin', rarity:'epic',      image:`${DECK_R2}/assassin_11.png`, dmg_bonus:10, crit:0,  first_attack:10, hp_threshold:50,   hp_above:false, team_synergy:null },
  assassin_12: { key:'assassin_12', name:'Ombre de la Mort',     type:'assassin', rarity:'legendary', image:`${DECK_R2}/assassin_12.png`, dmg_bonus:15, crit:12, first_attack:20, hp_threshold:50,   hp_above:false, team_synergy:null },
};

// Calcul des bonus du deck d'un joueur + synergies clan
async function calcDeckBonus(userId, bossHpPct, clanId) {
  const deckQ = await pool.query(
    `SELECT card_key FROM player_raid_deck WHERE user_id=$1 ORDER BY slot`,
    [userId]
  );
  const cards = deckQ.rows.map(r => RAID_CARDS[r.card_key]).filter(Boolean);

  // Récupérer les decks des autres membres du clan
  const allDecksQ = await pool.query(`
    SELECT prd.card_key FROM player_raid_deck prd
    JOIN clan_members cm ON cm.user_id = prd.user_id
    WHERE cm.clan_id=$1 AND prd.user_id!=$2
  `, [clanId, userId]);
  const allyClanCards = allDecksQ.rows.map(r => RAID_CARDS[r.card_key]).filter(Boolean);
  const allClanCards = [...cards, ...allyClanCards];

  // Déterminer les types présents dans le clan
  const clanTypes = new Set(allClanCards.map(c => c.type));
  const soutienCount = allClanCards.filter(c => c.type === 'soutien').length;
  const hasSoutienInClan = clanTypes.has('soutien');

  let dmg_bonus = 0, crit = 0, first_attack = 0, clan_dmg = 0;

  for (const card of cards) {
    // Vérif condition HP
    let conditionMet = true;
    if (card.hp_threshold !== null) {
      if (card.hp_above && bossHpPct <= card.hp_threshold) conditionMet = false;
      if (!card.hp_above && bossHpPct >= card.hp_threshold) conditionMet = false;
    }
    if (!conditionMet) continue;

    dmg_bonus += card.dmg_bonus || 0;
    crit += card.crit || 0;
    first_attack += card.first_attack || 0;
  }

  // Bonus des cartes Soutien des alliés (effets clan)
  for (const card of allyClanCards) {
    if (card.type !== 'soutien') continue;

    let conditionMet = true;
    if (card.hp_threshold !== null) {
      if (card.hp_above && bossHpPct <= card.hp_threshold) conditionMet = false;
      if (!card.hp_above && bossHpPct >= card.hp_threshold) conditionMet = false;
    }
    if (!conditionMet) continue;

    switch(card.team_synergy) {
      case 'clan_dmg':        dmg_bonus += card.dmg_bonus; break;
      case 'clan_crit':       crit += card.crit; break;
      case 'clan_first_attack': first_attack += card.first_attack; break;
      case 'clan_dmg_low_hp': dmg_bonus += card.dmg_bonus; break;
      case 'clan_dmg_and_first': dmg_bonus += card.dmg_bonus; first_attack += card.first_attack; break;
      case 'ally_dmg_2':      dmg_bonus += 2; break;
      case 'clan_dmg_slayer_assassin':
        if (clanTypes.has('slayer') && clanTypes.has('assassin')) dmg_bonus += card.dmg_bonus;
        break;
      case 'clan_crit_2soutien':
        crit += card.crit;
        if (soutienCount >= 2) crit += 1.5;
        break;
    }
  }

  // Synergies propres à la carte du joueur
  for (const card of cards) {
    switch(card.team_synergy) {
      case 'slayer_dmg_3':
        const slayerCount = allClanCards.filter(c => c.type === 'slayer').length;
        dmg_bonus += 3 * Math.max(0, slayerCount - 1);
        break;
      case 'crit_if_soutien':
        if (hasSoutienInClan) crit += 5;
        break;
      case 'clan_dmg_slayer_assassin':
        if (clanTypes.has('slayer') && clanTypes.has('assassin')) dmg_bonus += card.dmg_bonus;
        break;
    }
  }

  // === BONUS STATS PERSONNAGE ===
  const charQ = await pool.query(`SELECT * FROM player_character WHERE user_id=$1`, [userId]);
  const char = charQ.rows[0] || null;
  const statBonus = charStatBonus(char, bossHpPct);
  dmg_bonus    += statBonus.dmg_bonus || 0;
  crit         += statBonus.crit      || 0;
  first_attack += statBonus.first_attack || 0;
  clan_dmg     += statBonus.clan_dmg  || 0; // Intelligence → DMG clan

  // === BONUS ÉQUIPEMENT ===
  const eqBonus = await getEquipmentBonus(userId);
  dmg_bonus    += eqBonus.dmg_bonus;
  crit         += eqBonus.crit;
  first_attack += eqBonus.first_attack;
  // clan_dmg et clan_crit s'appliquent comme bonus de soutien
  dmg_bonus    += eqBonus.clan_dmg;
  crit         += eqBonus.clan_crit;

  // Fusionner clan_dmg dans dmg_bonus (les deux augmentent les dégâts perso)
  dmg_bonus += clan_dmg;

  return {
    dmg_bonus: Math.round(dmg_bonus * 10) / 10,
    crit: Math.round(crit * 10) / 10,
    first_attack: Math.round(first_attack * 10) / 10,
    cards,
    charStatBonus: statBonus,
    equipmentBonus: eqBonus,
  };
}

// Appliquer les bonus au stock de dégâts
function applyDeckToStock(stock, bonus, isFirstAttack) {
  let dmg = stock;
  let multiplier = 1 + (bonus.dmg_bonus / 100);
  if (isFirstAttack) multiplier += (bonus.first_attack / 100);

  dmg = Math.floor(dmg * multiplier);

  // Crit
  if (bonus.crit > 0 && Math.random() * 100 < bonus.crit) {
    dmg = Math.floor(dmg * 2);
    return { dmg, crit: true };
  }
  return { dmg, crit: false };
}

// Drop cartes après boss vaincu

async function dropRaidCards(userId) {
  // Récupérer les cartes déjà possédées
  const owned = await pool.query(`SELECT DISTINCT card_key FROM player_raid_cards WHERE user_id=$1`, [userId]);
  const ownedKeys = new Set(owned.rows.map(r => r.card_key));

  const allKeys = Object.keys(RAID_CARDS);
  const drops = [];

  function pickRarity(rarity) {
    const available = allKeys.filter(k => RAID_CARDS[k].rarity === rarity && !ownedKeys.has(k));
    if (!available.length) return null; // toutes déjà possédées
    return available[Math.floor(Math.random() * available.length)];
  }

  // 1 commune garantie (si pas déjà toutes possédées)
  const common = pickRarity('common');
  if (common) drops.push(common);

  // 50% rare
  if (Math.random() < 0.50) {
    const rare = pickRarity('rare');
    if (rare) drops.push(rare);
  }
  // 20% épique
  if (Math.random() < 0.20) {
    const epic = pickRarity('epic');
    if (epic) drops.push(epic);
  }
  // 5% légendaire
  if (Math.random() < 0.05) {
    const leg = pickRarity('legendary');
    if (leg) drops.push(leg);
  }

  const now = Date.now();
  for (const key of drops) {
    await pool.query(`INSERT INTO player_raid_cards(user_id, card_key, obtained_at) VALUES($1,$2,$3)`, [userId, key, now]);
  }
  return drops.map(k => RAID_CARDS[k]);
}

// =========================
// ÉQUIPEMENT — ROUTES
// =========================

// ===================================================
// FORGE
// ===================================================
const FORGE_GITHUB = 'https://raw.githubusercontent.com/skunfy/pok-gacha/main/forge';

const MATERIALS = {
  fer:     { key:'fer',    name:'Fer',            rarity:'common',    image:`${FORGE_GITHUB}/fer.png`,     desc:'Obtenu en détruisant un équipement Commun' },
  azurite: { key:'azurite',name:'Azurite',        rarity:'rare',      image:`${FORGE_GITHUB}/azurite.png`, desc:'Obtenu en détruisant un équipement Rare' },
  quartz:  { key:'quartz', name:'Quartz',         rarity:'epic',      image:`${FORGE_GITHUB}/quartz.png`,  desc:'Obtenu en détruisant un équipement Épique' },
  topaze:  { key:'topaze', name:'Topaze',         rarity:'legendary', image:`${FORGE_GITHUB}/topaze.png`,  desc:'Obtenu en détruisant un équipement Légendaire' },
};

// Matériau requis selon rareté de l'item + coût dollax + taux réussite par forge level
function forgeRequirements(rarity, forgeLevel) {
  const next = forgeLevel + 1;

  // Matériau = rareté de l'item
  const matKey = { common:'fer', rare:'azurite', epic:'quartz', legendary:'topaze' }[rarity] || 'fer';

  // Quantité croissante avec le niveau (1-5 → 1-5 mat, 6-10 → 2-6 mat, 11-15 → 3-7 mat)
  const matQty = Math.ceil(next / 3);

  // Coût et taux de réussite selon le palier de forge
  let cost, successRate;
  if (next <= 5)       { cost = 200 * next;               successRate = 100; }
  else if (next <= 9)  { cost = 1250 + 500 * (next - 5);  successRate = 75;  }
  else if (next <= 12) { cost = 5000 + 1250 * (next - 10);successRate = 50;  }
  else                 { cost = 10000 + 2000 * (next - 13);successRate = 25;  }

  return { matKey, matQty, cost, successRate };
}

// Destruction : matériaux obtenus selon rareté
function destroyYield(rarity) {
  const map = { common:'fer', rare:'azurite', epic:'quartz', legendary:'topaze' };
  const qty = rarity === 'legendary' ? 1 : rarity === 'epic' ? 1 : rarity === 'rare' ? 2 : 2;
  return { matKey: map[rarity] || 'fer', qty };
}

// Calcul des stats forgées (+10% des stats de base par niveau, ×2.5 à +15)
function forgedStats(def, forgeLevel) {
  const mult = 1 + (forgeLevel * 0.10);
  return {
    dmg_bonus:    Math.round(def.dmg_bonus    * mult * 10) / 10,
    crit:         Math.round(def.crit         * mult * 10) / 10,
    first_attack: Math.round(def.first_attack * mult * 10) / 10,
    clan_dmg:     Math.round(def.clan_dmg     * mult * 10) / 10,
    clan_crit:    Math.round(def.clan_crit    * mult * 10) / 10,
  };
}

// GET /api/forge — inventaire + matériaux
app.get("/api/forge", auth, async (req, res) => {
  try {
    const [eqQ, matQ] = await Promise.all([
      pool.query(`SELECT id, equip_key, forge_level, equipped_slot FROM player_equipment WHERE user_id=$1 ORDER BY obtained_at DESC`, [req.user.id]),
      pool.query(`SELECT mat_key, quantity FROM player_materials WHERE user_id=$1`, [req.user.id]),
    ]);
    const inventory = eqQ.rows.map(r => {
      const def = EQUIPMENT[r.equip_key] || {};
      return { id: r.id, equip_key: r.equip_key, forge_level: r.forge_level || 0, equipped_slot: r.equipped_slot, ...def, ...forgedStats(def, r.forge_level || 0) };
    });
    const materials = {};
    for (const m of matQ.rows) materials[m.mat_key] = parseInt(m.quantity);
    res.json({ inventory, materials, materialDefs: Object.values(MATERIALS) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/forge/upgrade — améliorer un item
app.post("/api/forge/upgrade", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const itemId = parseInt(req.body?.id) || 0;
    const userId = req.user.id;

    const itemQ = await client.query(`SELECT id, equip_key, forge_level FROM player_equipment WHERE id=$1 AND user_id=$2`, [itemId, userId]);
    const item = itemQ.rows[0];
    if (!item) { await client.query('ROLLBACK'); return res.status(404).json({ error: "Item introuvable" }); }

    const forgeLevel = item.forge_level || 0;
    if (forgeLevel >= 15) { await client.query('ROLLBACK'); return res.status(400).json({ error: "Niveau maximum atteint !" }); }

    const def = EQUIPMENT[item.equip_key];
    if (!def) { await client.query('ROLLBACK'); return res.status(400).json({ error: "Item invalide" }); }

    const { matKey, matQty, cost, successRate } = forgeRequirements(def.rarity, forgeLevel);

    // Vérifier matériaux
    const matQ = await client.query(`SELECT quantity FROM player_materials WHERE user_id=$1 AND mat_key=$2`, [userId, matKey]);
    const owned = parseInt(matQ.rows[0]?.quantity || 0);
    if (owned < matQty) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Il te faut ${matQty} ${MATERIALS[matKey]?.name} (tu en as ${owned})` }); }

    // Vérifier dollax
    const userQ = await client.query(`SELECT money FROM users WHERE id=$1`, [userId]);
    if (Number(userQ.rows[0]?.money || 0) < cost) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Il te faut ${cost} dollax` }); }

    // Déduire matériaux + dollax
    await client.query(`UPDATE player_materials SET quantity = quantity - $1 WHERE user_id=$2 AND mat_key=$3`, [matQty, userId, matKey]);
    await client.query(`UPDATE users SET money = money - $1 WHERE id=$2`, [cost, userId]);

    // Jet de chance
    const success = Math.random() * 100 < successRate;
    if (success) {
      await client.query(`UPDATE player_equipment SET forge_level = forge_level + 1 WHERE id=$1`, [itemId]);
    }

    await client.query('COMMIT');
    const newLevel = success ? forgeLevel + 1 : forgeLevel;
    res.json({ ok: true, success, newLevel, itemId });
  } catch(e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// POST /api/forge/destroy — détruire un item pour matériaux
app.post("/api/forge/destroy", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const itemId = parseInt(req.body?.id) || 0;
    const userId = req.user.id;

    const itemQ = await client.query(`SELECT id, equip_key, equipped_slot FROM player_equipment WHERE id=$1 AND user_id=$2`, [itemId, userId]);
    const item = itemQ.rows[0];
    if (!item) { await client.query('ROLLBACK'); return res.status(404).json({ error: "Item introuvable" }); }
    if (item.equipped_slot) { await client.query('ROLLBACK'); return res.status(400).json({ error: "Déséquipe l'item avant de le détruire !" }); }

    const def = EQUIPMENT[item.equip_key];
    if (!def) { await client.query('ROLLBACK'); return res.status(400).json({ error: "Item invalide" }); }

    const { matKey, qty } = destroyYield(def.rarity);

    await client.query(`DELETE FROM player_equipment WHERE id=$1`, [itemId]);
    await client.query(`
      INSERT INTO player_materials(user_id, mat_key, quantity) VALUES($1,$2,$3)
      ON CONFLICT(user_id, mat_key) DO UPDATE SET quantity = player_materials.quantity + $3
    `, [userId, matKey, qty]);

    await client.query('COMMIT');
    res.json({ ok: true, matKey, qty, matName: MATERIALS[matKey]?.name });
  } catch(e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

// ===================================================
// GET /api/equipment — inventaire + équipés
app.get("/api/equipment", auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, equip_key, obtained_at, equipped_slot, forge_level FROM player_equipment WHERE user_id=$1 ORDER BY obtained_at DESC`,
    [req.user.id]
  );

  // Construire l'inventaire avec les données du catalogue
  const inventory = rows.map(r => ({
    id: r.id,
    equip_key: r.equip_key,
    equipped_slot: r.equipped_slot,
    obtained_at: Number(r.obtained_at),
    ...(EQUIPMENT[r.equip_key] || { name: r.equip_key, rarity: 'common', slot: 'weapon' }),
    forge_level: r.forge_level || 0,
  }));

  // Slots équipés
  const equipped = {};
  for (const item of inventory) {
    if (item.equipped_slot) equipped[item.equipped_slot] = item;
  }

  res.setHeader('Cache-Control', 'private, max-age=15');
  res.json({ inventory, equipped, catalogue: Object.values(EQUIPMENT) });
});

// POST /api/equipment/equip — équiper ou déséquiper
app.post("/api/equipment/equip", auth, async (req, res) => {
  const itemId = Number(req.body?.id || 0) | 0;
  const unequip = req.body?.unequip === true;

  if (!itemId) return res.status(400).json({ error: "Missing id" });

  // Vérifier que l'item appartient au joueur
  const itemQ = await pool.query(
    `SELECT id, equip_key, equipped_slot FROM player_equipment WHERE id=$1 AND user_id=$2`,
    [itemId, req.user.id]
  );
  const item = itemQ.rows[0];
  if (!item) return res.status(404).json({ error: "Item introuvable" });

  const def = EQUIPMENT[item.equip_key];
  if (!def) return res.status(400).json({ error: "Item invalide" });

  if (unequip) {
    // Déséquiper
    await pool.query(`UPDATE player_equipment SET equipped_slot=NULL WHERE id=$1`, [itemId]);
    return res.json({ ok: true, action: 'unequipped' });
  }

  // Déséquiper l'item déjà en place sur ce slot
  await pool.query(
    `UPDATE player_equipment SET equipped_slot=NULL WHERE user_id=$1 AND equipped_slot=$2`,
    [req.user.id, def.slot]
  );

  // Équiper le nouvel item
  await pool.query(
    `UPDATE player_equipment SET equipped_slot=$1 WHERE id=$2`,
    [def.slot, itemId]
  );

  res.json({ ok: true, action: 'equipped', slot: def.slot });
});

// Helper : récupère les bonus d'équipement d'un joueur

// GET /api/raid/cards — inventaire + deck du joueur
app.get("/api/raid/cards", auth, async (req, res) => {
  const [cardsQ, deckQ] = await Promise.all([
    pool.query(`SELECT id, card_key, obtained_at FROM player_raid_cards WHERE user_id=$1 ORDER BY obtained_at DESC`, [req.user.id]),
    pool.query(`SELECT slot, card_key FROM player_raid_deck WHERE user_id=$1 ORDER BY slot`, [req.user.id]),
  ]);

  const cards = cardsQ.rows.map(r => ({ id: r.id, ...RAID_CARDS[r.card_key], obtained_at: r.obtained_at })).filter(r => r.key);
  const deck = Array(5).fill(null);
  deckQ.rows.forEach(r => { deck[r.slot - 1] = { slot: r.slot, ...RAID_CARDS[r.card_key] }; });

  res.json({ cards, deck, catalogue: Object.values(RAID_CARDS) });
});

// POST /api/raid/deck — mettre une carte dans le deck
app.post("/api/raid/deck", auth, async (req, res) => {
  const slot = Number(req.body?.slot);
  const cardKey = String(req.body?.card_key || "");

  if (slot < 1 || slot > 5) return res.status(400).json({ error: "Slot invalide (1-5)" });

  // Vérifier que le joueur possède la carte
  if (cardKey) {
    const owns = await pool.query(`SELECT id FROM player_raid_cards WHERE user_id=$1 AND card_key=$2 LIMIT 1`, [req.user.id, cardKey]);
    if (!owns.rows.length) return res.status(400).json({ error: "Tu ne possèdes pas cette carte" });

    const card = RAID_CARDS[cardKey];
    if (!card) return res.status(400).json({ error: "Carte invalide" });

    // Max 1 légendaire par deck
    if (card.rarity === 'legendary') {
      const deckQ = await pool.query(`SELECT card_key FROM player_raid_deck WHERE user_id=$1`, [req.user.id]);
      const hasLeg = deckQ.rows.some(r => r.card_key !== cardKey && RAID_CARDS[r.card_key]?.rarity === 'legendary');
      if (hasLeg) return res.status(400).json({ error: "1 légendaire max par deck !" });
    }

    // Pas de doublon dans le deck
    const dupQ = await pool.query(`SELECT slot FROM player_raid_deck WHERE user_id=$1 AND card_key=$2 AND slot!=$3`, [req.user.id, cardKey, slot]);
    if (dupQ.rows.length) return res.status(400).json({ error: "Cette carte est déjà dans ton deck !" });

    await pool.query(`
      INSERT INTO player_raid_deck(user_id, slot, card_key) VALUES($1,$2,$3)
      ON CONFLICT(user_id, slot) DO UPDATE SET card_key=$3
    `, [req.user.id, slot, cardKey]);
  } else {
    // Vider le slot
    await pool.query(`DELETE FROM player_raid_deck WHERE user_id=$1 AND slot=$2`, [req.user.id, slot]);
  }

  res.json({ ok: true });
});

// GET /api/raid/bonus — bonus actifs du deck pour le raid en cours
app.get("/api/raid/bonus", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m) return res.json({ bonus: null, noClan: true });

  const bQ = await pool.query(`SELECT hp_current, hp_max FROM clan_boss WHERE clan_id=$1 AND defeated=0 AND failed=0 ORDER BY id DESC LIMIT 1`, [m.clan_id]);
  const boss = bQ.rows[0];
  const hpPct = boss ? Math.round((boss.hp_current / boss.hp_max) * 100) : 100;

  const bonus = await calcDeckBonus(req.user.id, hpPct, m.clan_id);
  res.json({ bonus, hpPct });
});

// Hook: progresser missions quand on ouvre des cartes
// Appelé depuis /api/open et /api/open_multi

// POST /api/clan/dissolve — dissoudre le clan (meneur seulement)
app.post("/api/clan/dissolve", auth, async (req, res) => {
  const m = await getMyMembership(req.user.id);
  if (!m || m.role !== 'leader') return res.status(403).json({ error: "Meneur seulement" });

  const confirm = String(req.body?.confirm || "");
  if (confirm !== "DISSOUDRE") return res.status(400).json({ error: "Confirmation invalide" });

  try {
    // Cascade supprime tout grâce aux ON DELETE CASCADE
    await pool.query(`DELETE FROM clans WHERE id=$1`, [m.clan_id]);
    res.json({ ok: true });
  } catch(e) {
    console.error("Dissolve clan error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// =========================
// PVP — ÉNERGIE
// =========================

const PVP_ENERGY_MAX      = 100;
const PVP_ENERGY_PER_DUEL = 10;
const PVP_ENERGY_REGEN_MS = 60 * 60 * 1000; // +10 par heure

async function getPvpEnergy(userId) {
  const r = await pool.query(
    `SELECT pvp_energy, pvp_energy_last_refill FROM users WHERE id=$1`, [userId]
  );
  if (!r.rows.length) return { energy: PVP_ENERGY_MAX, lastRefill: Date.now() };
  let energy     = Number(r.rows[0].pvp_energy ?? PVP_ENERGY_MAX);
  let lastRefill = Number(r.rows[0].pvp_energy_last_refill ?? Date.now());
  const tranches = Math.floor((Date.now() - lastRefill) / PVP_ENERGY_REGEN_MS);
  if (tranches > 0) {
    energy = Math.min(PVP_ENERGY_MAX, energy + tranches * PVP_ENERGY_PER_DUEL);
    lastRefill += tranches * PVP_ENERGY_REGEN_MS;
    await pool.query(
      `UPDATE users SET pvp_energy=$1, pvp_energy_last_refill=$2 WHERE id=$3`,
      [energy, lastRefill, userId]
    );
  }
  return { energy, lastRefill };
}

async function consumePvpEnergy(userId) {
  const { energy, lastRefill } = await getPvpEnergy(userId);
  if (energy < PVP_ENERGY_PER_DUEL)
    throw new Error(`⚡ Énergie insuffisante — il te faut ${PVP_ENERGY_PER_DUEL} points (tu en as ${energy}).`);
  await pool.query(
    `UPDATE users SET pvp_energy=$1, pvp_energy_last_refill=$2 WHERE id=$3`,
    [energy - PVP_ENERGY_PER_DUEL, lastRefill, userId]
  );
}

// GET /api/pvp/energy
app.get("/api/pvp/energy", auth, async (req, res) => {
  try {
    const { energy, lastRefill } = await getPvpEnergy(req.user.id);
    res.json({ energy, lastRefill, max: PVP_ENERGY_MAX, costPerDuel: PVP_ENERGY_PER_DUEL });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// =========================
// PVP — SYSTÈME DE RANG
// =========================

const PVP_RANKS = [
  { name: 'Bronze',   min: 0,    max: 1199, color: '#cd7f32', icon: '🥉' },
  { name: 'Argent',   min: 1200, max: 1399, color: '#aaa',    icon: '🥈' },
  { name: 'Or',       min: 1400, max: 1599, color: '#ffd84d', icon: '🥇' },
  { name: 'Platine',  min: 1600, max: 1799, color: '#4da6ff', icon: '💠' },
  { name: 'Diamant',  min: 1800, max: 1999, color: '#c084ff', icon: '💎' },
  { name: 'Maître',   min: 2000, max: 9999, color: '#ff6464', icon: '👑' },
];

function getRankInfo(pts) {
  return PVP_RANKS.find(r => pts >= r.min && pts <= r.max) || PVP_RANKS[0];
}

// Calcul ELO simplifié
function calcElo(winnerRank, loserRank) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (loserRank - winnerRank) / 400));
  return Math.round(K * (1 - expected));
}

// Reset mensuel : perd max 2 rangs (200 pts par rang)
async function monthlyRankReset() {
  const users = await pool.query(`SELECT id, pvp_rank FROM users WHERE pvp_rank > 1000`);
  for (const u of users.rows) {
    const rank = Number(u.pvp_rank);
    // Trouver le rang actuel et reculer de 2 paliers max
    const rankIdx = PVP_RANKS.findIndex(r => rank >= r.min && rank <= r.max);
    const targetIdx = Math.max(0, rankIdx - 2);
    const newRank = Math.max(PVP_RANKS[targetIdx].min, rank - 400);
    await pool.query(`UPDATE users SET pvp_rank=$1, pvp_wins=0, pvp_losses=0 WHERE id=$2`, [newRank, u.id]);
  }
}

// Construire les stats PVP d'un joueur
async function buildPvpFighter(userId) {
  const char = await getOrCreateCharacter(userId);
  const userQ = await pool.query(`SELECT name, avatar, pvp_rank, pvp_wins, pvp_losses FROM users WHERE id=$1`, [userId]);
  const u = userQ.rows[0];
  const statBonus = charStatBonus(char, 100);
  const eqBonus   = await getEquipmentBonus(userId);

  const lvl    = Number(char.char_level);
  const cls    = CHAR_CLASSES[char.char_class] || null;

  // HP = base + force × 8 + niveau × 12
  const hp     = Math.round(200 + (Number(char.stat_force) * 8) + (lvl * 12));
  // ATQ = base + stat bonus + équipement
  const atq    = Math.round(20 + statBonus.dmg_bonus + eqBonus.dmg_bonus + eqBonus.clan_dmg);
  // Crit %
  const crit   = Math.min(95, Math.round(statBonus.crit + eqBonus.crit + eqBonus.clan_crit));
  // Esquive % = dextérité / 3
  const dodge  = Math.min(40, Math.round(Number(char.stat_dexterite) * 0.4));
  // Vitesse (qui attaque en premier) = dextérité + first_attack bonus
  const speed  = Math.round(Number(char.stat_dexterite) * statEffectiveRate('dexterite', char.char_class) + statBonus.first_attack + eqBonus.first_attack);

  return {
    userId,
    name:       u.name,
    avatar:     u.avatar || null,
    rank:       Number(u.pvp_rank),
    wins:       Number(u.pvp_wins),
    losses:     Number(u.pvp_losses),
    rankInfo:   getRankInfo(Number(u.pvp_rank)),
    charClass:  char.char_class,
    classLabel: cls?.label || 'Aucune',
    classColor: cls?.color || '#aaa',
    level:      lvl,
    hp, atq, crit, dodge, speed,
  };
}

// Simuler le combat côté serveur
function simulatePvpBattle(f1, f2) {
  let hp1 = f1.hp, hp2 = f2.hp;
  const log = [];

  // Déterminer qui frappe en premier
  const [first, second] = f1.speed >= f2.speed ? [f1, f2] : [f2, f1];
  let hpFirst = first === f1 ? hp1 : hp2;
  let hpSecond = first === f1 ? hp2 : hp1;

  for (let turn = 1; turn <= 50; turn++) {
    log.push({ type: 'turn', turn });

    // Attaque du premier
    const dodge1 = Math.random() * 100 < second.dodge;
    if (dodge1) {
      log.push({ type: 'dodge', attacker: first.name, defender: second.name });
    } else {
      const crit1 = Math.random() * 100 < first.crit;
      const dmg1 = Math.round(first.atq * (0.85 + Math.random() * 0.3) * (crit1 ? 2 : 1));
      hpSecond = Math.max(0, hpSecond - dmg1);
      log.push({ type: crit1 ? 'crit' : 'hit', attacker: first.name, defender: second.name, dmg: dmg1, hpLeft: hpSecond, hpMax: second.hp });
    }

    if (hpSecond <= 0) break;

    // Attaque du second
    const dodge2 = Math.random() * 100 < first.dodge;
    if (dodge2) {
      log.push({ type: 'dodge', attacker: second.name, defender: first.name });
    } else {
      const crit2 = Math.random() * 100 < second.crit;
      const dmg2 = Math.round(second.atq * (0.85 + Math.random() * 0.3) * (crit2 ? 2 : 1));
      hpFirst = Math.max(0, hpFirst - dmg2);
      log.push({ type: crit2 ? 'crit' : 'hit', attacker: second.name, defender: first.name, dmg: dmg2, hpLeft: hpFirst, hpMax: first.hp });
    }

    if (hpFirst <= 0) break;
  }

  // Déterminer le gagnant (celui avec + de HP restants si timeout)
  let winner;
  if (hpSecond <= 0 && hpFirst > 0) winner = first;
  else if (hpFirst <= 0 && hpSecond > 0) winner = second;
  else winner = hpFirst >= hpSecond ? first : second;

  log.push({ type: 'end', winner: winner.name });
  return { log, winner };
}

// GET /api/pvp/me — profil PVP du joueur
app.get("/api/pvp/me", auth, async (req, res) => {
  try {
    const fighter = await buildPvpFighter(req.user.id);
    res.json({ fighter });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/pvp/leaderboard — top joueurs
app.get("/api/pvp/leaderboard", auth, async (req, res) => {
  try {
    const topQ = await pool.query(`
      SELECT u.id, u.name, u.avatar, u.pvp_rank, u.pvp_wins, u.pvp_losses,
             pc.char_class
      FROM users u
      LEFT JOIN player_character pc ON pc.user_id = u.id
      ORDER BY u.pvp_rank DESC, u.pvp_wins DESC
      LIMIT 50
    `);
    const meQ = await pool.query(`SELECT pvp_rank, pvp_wins, pvp_losses, avatar FROM users WHERE id=$1`, [req.user.id]);
    const me = meQ.rows[0];
    res.json({
      top: topQ.rows.map((u,i) => ({
        rank: i+1,
        name: u.name,
        avatar: u.avatar || null,
        charClass: u.char_class || null,
        pts: Number(u.pvp_rank),
        wins: Number(u.pvp_wins),
        losses: Number(u.pvp_losses),
        rankInfo: getRankInfo(Number(u.pvp_rank)),
      })),
      me: { pts: Number(me?.pvp_rank||1000), wins: Number(me?.pvp_wins||0), losses: Number(me?.pvp_losses||0), rankInfo: getRankInfo(Number(me?.pvp_rank||1000)), avatar: me?.avatar || null },
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/pvp/search?name=... — chercher un joueur à défier
app.get("/api/pvp/search", auth, async (req, res) => {
  const q = String(req.query.name || '').trim();
  if (q.length < 2) return res.json({ users: [] });
  try {
    const r = await pool.query(
      `SELECT id, name, avatar, pvp_rank, pvp_wins, pvp_losses FROM users WHERE name ILIKE $1 AND id != $2 LIMIT 10`,
      ['%'+q+'%', req.user.id]
    );
    res.json({ users: r.rows.map(u => ({ id: u.id, name: u.name, avatar: u.avatar||'', pts: Number(u.pvp_rank), rankInfo: getRankInfo(Number(u.pvp_rank)) })) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/pvp/challenge — envoyer un défi
app.post("/api/pvp/challenge", auth, async (req, res) => {
  const opponentId = Number(req.body?.opponentId || 0) | 0;
  if (!opponentId || opponentId === req.user.id) return res.status(400).json({ error: "Cible invalide" });
  try {
    // Vérifier + consommer l'énergie du challenger
    await consumePvpEnergy(req.user.id);

    // Vérifier pas déjà un défi en attente entre ces deux joueurs
    const pending = await pool.query(
      `SELECT id FROM pvp_battles WHERE status='pending' AND ((challenger_id=$1 AND opponent_id=$2) OR (challenger_id=$2 AND opponent_id=$1))`,
      [req.user.id, opponentId]
    );
    if (pending.rows.length) return res.status(400).json({ error: "Un défi est déjà en attente" });

    const opponent = await pool.query(`SELECT id, name, pvp_rank FROM users WHERE id=$1`, [opponentId]);
    if (!opponent.rows.length) return res.status(404).json({ error: "Joueur introuvable" });

    const me = await pool.query(`SELECT pvp_rank FROM users WHERE id=$1`, [req.user.id]);
    const battle = await pool.query(
      `INSERT INTO pvp_battles(challenger_id, opponent_id, status, challenger_rank_before, opponent_rank_before, created_at) VALUES($1,$2,'pending',$3,$4,$5) RETURNING id`,
      [req.user.id, opponentId, Number(me.rows[0].pvp_rank), Number(opponent.rows[0].pvp_rank), Date.now()]
    );
    // Notif pour l'adversaire
    await pool.query(
      `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'pvp','⚔️ Défi PVP !',$2,$3,0,$4)`,
      [opponentId, `${req.user.name} te défie en combat !`, JSON.stringify({ battleId: battle.rows[0].id }), Date.now()]
    );
    res.json({ ok: true, battleId: battle.rows[0].id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/pvp/accept — accepter et simuler le combat
app.post("/api/pvp/accept", auth, async (req, res) => {
  const battleId = Number(req.body?.battleId || 0) | 0;
  if (!battleId) return res.status(400).json({ error: "Bataille invalide" });
  try {
    const bQ = await pool.query(`SELECT * FROM pvp_battles WHERE id=$1 AND opponent_id=$2 AND status='pending'`, [battleId, req.user.id]);
    if (!bQ.rows.length) return res.status(404).json({ error: "Défi introuvable ou déjà traité" });
    const battle = bQ.rows[0];

    // Construire les fighters
    const [f1, f2] = await Promise.all([
      buildPvpFighter(battle.challenger_id),
      buildPvpFighter(battle.opponent_id),
    ]);

    // Simuler
    const { log, winner } = simulatePvpBattle(f1, f2);
    const winnerId = winner.name === f1.name ? f1.userId : f2.userId;
    const loserId  = winnerId === f1.userId ? f2.userId : f1.userId;
    const winnerRank = winnerId === f1.userId ? f1.rank : f2.rank;
    const loserRank  = loserId  === f1.userId ? f1.rank : f2.rank;
    const rankChange = calcElo(winnerRank, loserRank);

    // Mettre à jour les rangs
    await pool.query(`UPDATE users SET pvp_rank=GREATEST(0,pvp_rank+$1), pvp_wins=pvp_wins+1 WHERE id=$2`, [rankChange, winnerId]);
    await pool.query(`UPDATE users SET pvp_rank=GREATEST(0,pvp_rank-$1), pvp_losses=pvp_losses+1 WHERE id=$2`, [rankChange, loserId]);

    // Sauvegarder le résultat
    await pool.query(
      `UPDATE pvp_battles SET status='done', winner_id=$1, log=$2, rank_change=$3, accepted_at=$4 WHERE id=$5`,
      [winnerId, JSON.stringify(log), rankChange, Date.now(), battleId]
    );

    // Notif au challenger
    await pool.query(
      `INSERT INTO notifications(user_id,type,title,body,meta,is_read,createdAt) VALUES($1,'pvp',$2,$3,$4,0,$5)`,
      [battle.challenger_id,
       winnerId === battle.challenger_id ? '🏆 Victoire PVP !' : '💀 Défaite PVP',
       winnerId === battle.challenger_id ? `Tu as battu ${f2.name} ! +${rankChange} pts` : `${f2.name} t'a battu. -${rankChange} pts`,
       JSON.stringify({ battleId }), Date.now()]
    );

    res.json({ ok: true, battleId, winnerId, rankChange, log, fighters: { f1, f2 } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/pvp/decline — refuser un défi
app.post("/api/pvp/decline", auth, async (req, res) => {
  const battleId = Number(req.body?.battleId || 0) | 0;
  try {
    await pool.query(`UPDATE pvp_battles SET status='declined' WHERE id=$1 AND opponent_id=$2 AND status='pending'`, [battleId, req.user.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/pvp/pending — défis en attente pour moi
app.get("/api/pvp/pending", auth, async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT pb.id, pb.challenger_id, pb.created_at, u.name as challenger_name, u.avatar, u.pvp_rank as challenger_rank
      FROM pvp_battles pb JOIN users u ON u.id=pb.challenger_id
      WHERE pb.opponent_id=$1 AND pb.status='pending'
      ORDER BY pb.created_at DESC LIMIT 10
    `, [req.user.id]);
    res.json({ challenges: q.rows.map(r => ({ battleId: r.id, challengerId: r.challenger_id, challengerName: r.challenger_name, avatar: r.avatar||'', rankInfo: getRankInfo(Number(r.challenger_rank)), createdAt: Number(r.created_at) })) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/pvp/history — historique des combats
app.get("/api/pvp/history", auth, async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT pb.id, pb.winner_id, pb.rank_change, pb.accepted_at, pb.log,
             u1.name as challenger_name, u2.name as opponent_name,
             pb.challenger_id, pb.opponent_id
      FROM pvp_battles pb
      JOIN users u1 ON u1.id=pb.challenger_id
      JOIN users u2 ON u2.id=pb.opponent_id
      WHERE (pb.challenger_id=$1 OR pb.opponent_id=$1) AND pb.status='done'
      ORDER BY pb.accepted_at DESC LIMIT 20
    `, [req.user.id]);
    res.json({ history: q.rows.map(r => ({
      battleId: r.id,
      opponentName: r.challenger_id === req.user.id ? r.opponent_name : r.challenger_name,
      won: r.winner_id === req.user.id,
      rankChange: r.winner_id === req.user.id ? +Number(r.rank_change) : -Number(r.rank_change),
      at: Number(r.accepted_at),
      log: r.log,
    })) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/pvp/result/:id — récupérer un combat pour replay
app.get("/api/pvp/result/:id", auth, async (req, res) => {
  const battleId = Number(req.params.id) | 0;
  try {
    const q = await pool.query(`
      SELECT pb.*, u1.name as cname, u1.avatar as cavatar, u2.name as oname, u2.avatar as oavatar FROM pvp_battles pb
      JOIN users u1 ON u1.id=pb.challenger_id JOIN users u2 ON u2.id=pb.opponent_id
      WHERE pb.id=$1 AND (pb.challenger_id=$2 OR pb.opponent_id=$2)
    `, [battleId, req.user.id]);
    if (!q.rows.length) return res.status(404).json({ error: "Combat introuvable" });
    const r = q.rows[0];
    // Récupérer la classe des deux joueurs pour le replay animé
    const [c1char, c2char] = await Promise.all([
      pool.query('SELECT char_class FROM player_character WHERE user_id=$1 LIMIT 1', [r.challenger_id]),
      pool.query('SELECT char_class FROM player_character WHERE user_id=$1 LIMIT 1', [r.opponent_id]),
    ]);
    res.json({ battle: {
      id: r.id,
      challengerName:     r.cname,
      opponentName:       r.oname,
      challengerClass:    c1char.rows[0]?.char_class || null,
      opponentClass:      c2char.rows[0]?.char_class || null,
      challengerAvatar:   r.cavatar || null,
      opponentAvatar:     r.oavatar || null,
      challengerRankInfo: getRankInfo(Number(r.challenger_rank_before||1000)),
      opponentRankInfo:   getRankInfo(Number(r.opponent_rank_before||1000)),
      winnerId:   r.winner_id,
      rankChange: r.rank_change,
      log:        r.log,
      at:         r.accepted_at,
    }});
  } catch(e) { res.status(500).json({ error: e.message }); }
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