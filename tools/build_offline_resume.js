import fs from "fs";
import path from "path";

const API_KEY = process.env.POKEMONTCG_API_KEY || "";

// ✅ réglages
const TARGET = 500;               // nombre de cartes à collecter
const PAGE_SIZE = 25;             // taille page API
const PAGE_MAX = 80;              // pages random 1..PAGE_MAX (plus stable que 300)
const IMG_CONCURRENCY = 6;        // download images en parallèle
const BETWEEN_IMAGES_MS = 110;    // pause entre images
const META_DELAY_OK_MS = 900;     // pause entre requêtes metadata quand tout va bien

const HTTP_TIMEOUT_MS = 120000;

// Backoff anti-504/429
const BACKOFF_BASE_MS = 2500;
const BACKOFF_MAX_MS = 60000;

const OUT_DIR = path.resolve("data");
const IMG_DIR = path.join(OUT_DIR, "images");
const OUT_JSON = path.join(OUT_DIR, "cards.json");
const STATE_JSON = path.join(OUT_DIR, "download_state.json");

fs.mkdirSync(IMG_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function headers() {
  const h = {
    "User-Agent": "gacha-local-offline",
    "Accept": "application/json",
  };
  if (API_KEY) h["X-Api-Key"] = API_KEY;
  return h;
}

/* ✅ FIX: déduire la vraie extension depuis l’URL d’image */
function extFromUrl(u) {
  try {
    const p = new URL(u).pathname.toLowerCase();
    if (p.endsWith(".png")) return "png";
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "jpg";
    if (p.endsWith(".webp")) return "webp";
  } catch {}
  return "jpg";
}

function isHoloOrBetter(rarity) {
  if (!rarity) return false;
  const r = String(rarity).toLowerCase();
  if (r.includes("holo")) return true;

  const allow = [
    "amazing rare",
    "rare ultra",
    "rare secret",
    "rare rainbow",
    "rare shiny",
    "rare prism star",
    "rare ace",
    "rare break",
    "legend",
  ];
  return allow.some((x) => r.includes(x));
}

async function fetchWithTimeout(url, options = {}, ms = HTTP_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchPageRandom(page) {
  const params = new URLSearchParams({
    pageSize: String(PAGE_SIZE),
    page: String(page),
    select: "id,name,rarity,set,images",
  });

  const url = `https://api.pokemontcg.io/v2/cards?${params.toString()}`;
  const res = await fetchWithTimeout(url, { headers: headers() }, HTTP_TIMEOUT_MS);

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${t.slice(0, 120)}`);
  }
  return res.json();
}

async function downloadImage(url, dest) {
  const res = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": "gacha-local-offline", "Accept": "image/*" } },
    HTTP_TIMEOUT_MS
  );
  if (!res.ok) throw new Error(`IMG ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function loadState() {
  try {
    if (fs.existsSync(STATE_JSON)) {
      return JSON.parse(fs.readFileSync(STATE_JSON, "utf-8"));
    }
  } catch {}
  return { collected: {}, triedPages: 0 };
}

function saveState(state) {
  fs.writeFileSync(STATE_JSON, JSON.stringify(state, null, 2), "utf-8");
}

function buildCardsArray(collectedMap) {
  return Object.values(collectedMap).map((c) => ({
    name: c.name,
    set: c.set,
    rarity: c.rarity,
    image: c.local,
  }));
}

async function runQueue(items, workerFn, concurrency) {
  let idx = 0,
    active = 0,
    done = 0,
    ok = 0;

  return await new Promise((resolve) => {
    const next = async () => {
      while (active < concurrency && idx < items.length) {
        const item = items[idx++];
        active++;

        (async () => {
          try {
            const r = await workerFn(item);
            if (r) ok++;
          } catch {}
          finally {
            active--;
            done++;
            if (done % 25 === 0 || done === items.length) {
              process.stdout.write(`\r⬇️ Images: ${done}/${items.length} (ok ${ok})   `);
            }
            if (idx >= items.length && active === 0) resolve({ ok, total: items.length });
            else next();
          }
        })();
      }
    };
    next();
  });
}

async function main() {
  if (!API_KEY) console.log("⚠️ Pas de clé API. Risque de throttling.");

  const state = loadState();
  const seen = new Set(Object.keys(state.collected));

  console.log(`📦 Reprise: ${seen.size}/${TARGET} cartes`);
  console.log("🎯 Filtre: Holo et au-dessus (rarity)");
  console.log(`🎲 Pages aléatoires: 1..${PAGE_MAX} | pageSize=${PAGE_SIZE}`);

  let backoff = BACKOFF_BASE_MS;

  // 1) Collecte metadata
  while (seen.size < TARGET) {
    const page = 1 + Math.floor(Math.random() * PAGE_MAX);
    state.triedPages = (state.triedPages || 0) + 1;

    try {
      const data = await fetchPageRandom(page);

      // OK -> reset backoff
      backoff = BACKOFF_BASE_MS;

      const list = (data?.data || []).filter(
        (c) => c?.id && c.images?.small && isHoloOrBetter(c.rarity)
      );

      for (const c of list) {
        if (seen.size >= TARGET) break;
        if (seen.has(c.id)) continue;

        const ext = extFromUrl(c.images.small);
        const destName = `${c.id}.${ext}`;

        state.collected[c.id] = {
          id: c.id,
          name: c.name,
          set: c.set?.name ?? "Unknown set",
          rarity: c.rarity ?? "",
          remote: c.images.small,
          local: `/data/images/${destName}`,
        };

        seen.add(c.id);
      }

      saveState(state);
      process.stdout.write(
        `\r➡️ Cartes: ${seen.size}/${TARGET} | pages testées: ${state.triedPages}   `
      );

      await sleep(META_DELAY_OK_MS);
    } catch (e) {
      const msg = String(e?.message || e);
      const isBad =
        msg.includes("504") ||
        msg.includes("503") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("aborted");

      if (isBad) {
        backoff = Math.min(BACKOFF_MAX_MS, Math.floor(backoff * 1.7));
      }

      console.log(`\n⚠️ page fail: ${msg}\n   -> pause ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
    }
  }

  console.log("\n✅ Metadata terminée.");

  // 2) Download images (resume)
  const all = Object.values(state.collected);
  const toDownload = all.filter((c) => {
    const ext = extFromUrl(c.remote);
    return !fs.existsSync(path.join(IMG_DIR, `${c.id}.${ext}`));
  });

  console.log(`⬇️ Images à télécharger: ${toDownload.length} (concurrency=${IMG_CONCURRENCY})`);

  const result = await runQueue(
    toDownload,
    async (c) => {
      const ext = extFromUrl(c.remote);
      const dest = path.join(IMG_DIR, `${c.id}.${ext}`);
      try {
        await downloadImage(c.remote, dest);
        await sleep(BETWEEN_IMAGES_MS);
        return true;
      } catch (e) {
        console.log(`\n⚠️ skip img ${c.id}: ${String(e?.message || e)}`);
        return false;
      }
    },
    IMG_CONCURRENCY
  );

  console.log(`\n✅ Images OK: ${result.ok}/${result.total}`);

  // 3) Ecrire cards.json (uniquement images présentes)
  const finalMap = {};
  for (const c of all) {
    const ext = extFromUrl(c.remote);
    if (fs.existsSync(path.join(IMG_DIR, `${c.id}.${ext}`))) {
      finalMap[c.id] = c;
    }
  }

  const finalCards = buildCardsArray(finalMap);
  fs.writeFileSync(OUT_JSON, JSON.stringify(finalCards, null, 2), "utf-8");

  console.log(`🎉 Offline prêt: ${finalCards.length} cartes -> data/cards.json`);
  console.log("👉 Ensuite relance ton serveur : node ..\\server.js");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});