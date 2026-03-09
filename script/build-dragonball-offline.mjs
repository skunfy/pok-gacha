import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comme ton script est dans /script, on remonte à la racine du projet
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "dragonball");
const OUT_FILE = path.join(OUT_DIR, "cards.json");
const OUT_SETS_FILE = path.join(OUT_DIR, "sets.json");

const GITHUB_API_BASE = "https://api.github.com/repos/apitcg/dragon-ball-fusion-tcg-data/contents";
const RAW_BASE = "https://raw.githubusercontent.com/apitcg/dragon-ball-fusion-tcg-data/main";

async function fetchJson(url, timeoutMs = 20000, extraHeaders = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "dragonball-offline-builder/1.1",
        "Accept": "application/json",
        ...extraHeaders,
      },
    });

    if (!r.ok) {
      throw new Error(`HTTP ${r.status} for ${url}`);
    }

    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function fileCodeFromName(name) {
  return String(name || "")
    .replace(/\.[^.]+$/i, "")
    .trim();
}

function buildRawUrl(folder, filename) {
  return `${RAW_BASE}/${folder}/${encodeURIComponent(filename).replace(/%2F/g, "/")}`;
}

async function listGithubDir(dir) {
  return await fetchJson(`${GITHUB_API_BASE}/${dir}`);
}

async function loadJsonFile(folder, filename) {
  return await fetchJson(buildRawUrl(folder, filename));
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null && obj[key] !== "") return obj[key];
  }
  return null;
}

function normalizeImageField(imageField) {
  if (!imageField) return null;

  if (typeof imageField === "string") {
    return imageField.trim() || null;
  }

  if (typeof imageField === "object") {
    const candidate =
      imageField.high ||
      imageField.large ||
      imageField.medium ||
      imageField.small ||
      imageField.low ||
      imageField.url ||
      imageField.src ||
      null;

    return typeof candidate === "string" ? candidate.trim() || null : null;
  }

  return null;
}

function extractSetCode(card, fallback = "") {
  const raw = pick(card, ["setId", "setCode", "set", "series"]);

  if (typeof raw === "string") return raw.trim();

  if (raw && typeof raw === "object") {
    return normalizeText(raw.id || raw.code || raw.slug || raw.name || fallback);
  }

  return normalizeText(fallback);
}

function normalizeCard(card, filename, setsById) {
  const code = normalizeText(
    pick(card, ["code", "cardCode", "cardId", "id", "number"]) || ""
  );

  const fallbackSetId = fileCodeFromName(filename);
  const setId = extractSetCode(card, code.split("-")[0] || fallbackSetId);
  const setMeta = setsById.get(setId) || null;

  const image =
    normalizeImageField(pick(card, ["image", "images", "img", "picture"])) ||
    normalizeImageField(card?.imageUrl) ||
    normalizeImageField(card?.images?.small) ||
    normalizeImageField(card?.images?.medium) ||
    normalizeImageField(card?.images?.large) ||
    normalizeImageField(card?.images?.high);

  const imageHigh =
    normalizeImageField(card?.imagesHigh) ||
    normalizeImageField(card?.imageHigh) ||
    normalizeImageField(card?.images?.high) ||
    normalizeImageField(card?.images?.large) ||
    image;

  return {
    cardId: code || null,
    setId: setId || null,
    localId: normalizeText(
      pick(card, ["number", "localId", "no", "cardNumber"]) || code
    ),
    name: normalizeText(pick(card, ["name", "cardName"]) || "Unknown"),
    set: normalizeText(setMeta?.name || pick(card, ["setName"]) || setId),
    rarity: normalizeText(pick(card, ["rarity", "rarityCode"])),
    color: normalizeText(pick(card, ["color"])),
    type: normalizeText(pick(card, ["type", "cardType"])),
    cost: normalizeText(pick(card, ["cost", "energyCost"])),
    power: normalizeText(pick(card, ["power"])),
    image,
    imageHigh,
  };
}

function extractCardsArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.cards)) return raw.cards;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("📥 Fetch Dragon Ball sets index from GitHub.");
  const setFiles = await listGithubDir("sets/en");

  const cleanSets = [];
  const setsById = new Map();

  for (const item of Array.isArray(setFiles) ? setFiles : []) {
    if (item?.type !== "file" || !/\.json$/i.test(item?.name || "")) continue;

    try {
      const rawSet = await loadJsonFile("sets/en", item.name);
      const setId = normalizeText(
        pick(rawSet, ["id", "code", "slug"]) || fileCodeFromName(item.name)
      );
      const setName = normalizeText(
        pick(rawSet, ["name", "label", "title"]) || setId
      );

      const normalizedSet = {
        id: setId,
        name: setName,
      };

      cleanSets.push(normalizedSet);
      setsById.set(setId, normalizedSet);
    } catch (e) {
      console.log(`⚠️ set failed: ${item.name} (${e.message})`);
    }

    await sleep(60);
  }

  cleanSets.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUT_SETS_FILE, JSON.stringify(cleanSets, null, 2), "utf-8");
  console.log(`✅ Saved sets.json (${cleanSets.length} sets)`);

  console.log("📥 Fetch Dragon Ball cards index from GitHub.");
  const cardFiles = await listGithubDir("cards/en");
  const allCards = [];
  const seen = new Set();

  const files = (Array.isArray(cardFiles) ? cardFiles : [])
    .filter((item) => item?.type === "file" && /\.json$/i.test(item?.name || ""))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    console.log(`🃏 [${i + 1}/${files.length}] ${item.name}`);

    try {
      const raw = await loadJsonFile("cards/en", item.name);
      const rows = extractCardsArray(raw);

      if (!rows.length) {
        console.log(`⚠️ skipped ${item.name} (no cards array found)`);
        await sleep(40);
        continue;
      }

      let kept = 0;

      for (const row of rows) {
        const card = normalizeCard(row, item.name, setsById);

        if (!card.cardId && row?.id) {
          card.cardId = String(row.id).trim();
        }

        if (!card.cardId && row?.code) {
          card.cardId = String(row.code).trim();
        }

        if (!card.image) {
          card.image =
            row?.image ||
            row?.imageUrl ||
            row?.images?.small ||
            row?.images?.medium ||
            row?.images?.large ||
            row?.images?.high ||
            null;
        }

        if (!card.imageHigh) {
          card.imageHigh =
            row?.imageHigh ||
            row?.images?.large ||
            row?.images?.high ||
            card.image ||
            null;
        }

        if (!card.cardId || !card.image) continue;

        const dedupeKey = `${card.cardId}__${card.image}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        allCards.push(card);
        kept++;
      }

      console.log(`   -> ${kept} cartes gardées`);
    } catch (e) {
      console.log(`⚠️ card failed: ${item.name} (${e.message})`);
    }

    await sleep(40);
  }

  allCards.sort((a, b) => {
    const left = `${a.setId || ""}-${a.localId || ""}-${a.cardId || ""}`;
    const right = `${b.setId || ""}-${b.localId || ""}-${b.cardId || ""}`;
    return left.localeCompare(right);
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(allCards, null, 2), "utf-8");
  console.log(`✅ Saved cards.json (${allCards.length} cards)`);
  console.log(`📁 Output: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error("❌ build failed:", e);
  process.exit(1);
});