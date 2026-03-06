import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "pokemon");
const OUT_FILE = path.join(OUT_DIR, "cards.json");
const OUT_SETS_FILE = path.join(OUT_DIR, "sets.json");

async function fetchJson(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, { signal: controller.signal });
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

  const u = base.replace(/\/$/, "");
  if (/\.(png|jpe?g|webp)(\?|$)/i.test(u)) return u;
  if (/(\/low|\/high)$/i.test(u)) return `${u}.${ext}`;
  return `${u}/${quality}.${ext}`;
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
  const strippedLeadingDigits = s.replace(/^[0-9]+/g, "");

  const inferredByPrefix =
    s.startsWith("dp") ? "dp" :
    s.startsWith("pl") ? "pl" :
    s.startsWith("hgss") ? "hgss" :
    s.startsWith("bw") ? "bw" :
    s.startsWith("xy") ? "xy" :
    s.startsWith("sm") ? "sm" :
    s.startsWith("swsh") ? "swsh" :
    s.startsWith("sv") ? "sv" :
    s.startsWith("ex") ? "ex" :
    s.startsWith("neo") ? "neo" :
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

async function urlWorks(url, timeoutMs = 4000) {
  if (!url) return false;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (r.ok) return true;
  } catch {}

  try {
    const r = await fetch(url, { signal: controller.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function firstWorkingTcgdexImages(setId, localId, card = null) {
  if (!setId || !localId) return null;

  const langs = ["fr", "en"];
  const series = getTcgdexSerieCandidates(setId, card);

  for (const lang of langs) {
    for (const serie of series) {
      const low = `https://assets.tcgdex.net/${lang}/${serie}/${setId}/${localId}/low.webp`;
      const high = `https://assets.tcgdex.net/${lang}/${serie}/${setId}/${localId}/high.webp`;

      const ok = await urlWorks(low, 2500);
      if (ok) {
        return { image: low, imageHigh: high };
      }
    }
  }

  return null;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("📥 Fetch sets...");
  const sets = await fetchJson("https://api.tcgdex.net/v2/fr/sets");

  const cleanSets = Array.isArray(sets)
    ? sets.map((s) => ({
        id: String(s.id || "").trim(),
        name: String(s.name || s.id || "").trim()
      })).filter((s) => s.id)
    : [];

  fs.writeFileSync(OUT_SETS_FILE, JSON.stringify(cleanSets, null, 2), "utf-8");
  console.log(`✅ Saved sets.json (${cleanSets.length} sets)`);

  const allCards = [];

  for (let i = 0; i < cleanSets.length; i++) {
    const set = cleanSets[i];
    console.log(`📦 [${i + 1}/${cleanSets.length}] ${set.id} - ${set.name}`);

    let data = null;

    try {
      data = await fetchJson(`https://api.tcgdex.net/v2/fr/sets/${encodeURIComponent(set.id)}`);
    } catch {
      try {
        data = await fetchJson(`https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(set.id)}`);
      } catch (e) {
        console.log(`⚠️ set failed: ${set.id}`);
        continue;
      }
    }

    const cards = Array.isArray(data?.cards) ? data.cards : [];
    if (!cards.length) {
      console.log(`⚠️ no cards in set ${set.id}`);
      continue;
    }

    for (const c of cards) {
      const localId = String(c.localId || "").trim();
      if (!localId) continue;

      let image = normalizeImageField(c.image, "low", "webp");
      let imageHigh = normalizeImageField(c.image, "high", "webp");

      if (!image) {
        const found = await firstWorkingTcgdexImages(set.id, localId, c);
        if (found) {
          image = found.image;
          imageHigh = found.imageHigh;
        }
      }

      if (!image) continue;

      allCards.push({
        cardId: c.id || null,
        setId: set.id,
        localId,
        name: c.name || "Unknown",
        set: set.name,
        rarity: c.rarity || "",
        image,
        imageHigh: imageHigh || image
      });
    }

    await sleep(150);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(allCards, null, 2), "utf-8");
  console.log(`✅ Saved cards.json (${allCards.length} cards)`);
}

main().catch((e) => {
  console.error("❌ build failed:", e);
  process.exit(1);
});