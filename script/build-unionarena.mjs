// script/build-unionarena.mjs
// npm i -D playwright
// npx playwright install chromium
//
// Usage:
//   node script/build-unionarena.mjs
//   node script/build-unionarena.mjs --with-images

import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve("data", "unionarena");
const IMG_DIR = path.join(OUT_DIR, "images");
const OUT_CARDS = path.join(OUT_DIR, "cards.json");
const OUT_SETS = path.join(OUT_DIR, "sets.json");

const WITH_IMAGES = process.argv.includes("--with-images");

const NA_BASE = "https://www.unionarena-tcg.com/na/cardlist/index.php";
const JP_BASE = "https://www.unionarena-tcg.com/jp/cardlist/index.php";

const TARGET_JP_SERIES = [
  { title: "Re:ゼロから始める異世界生活 【UA40BT】", series: "570140" },
  { title: "To LOVEる-とらぶる- Memory of Heroines【UA45BT】", series: "570145" },
  { title: "銀魂 【UA11BT】", series: "570111" },
  { title: "君のことが大大大大大好きな100人の彼女 【UA26BT】", series: "570126" },
  { title: "〈物語〉シリーズ 【UA42BT】", series: "570142" },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\u2605]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function uniqueBy(arr, keyFn) {
  const out = [];
  const seen = new Set();
  for (const item of arr) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function downloadImage(url, filepath) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      referer: "https://www.unionarena-tcg.com/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = new Uint8Array(await res.arrayBuffer());
  fs.writeFileSync(filepath, arr);
}

async function gotoStable(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(1500);
}

// Scroll jusqu'en bas en attendant que le lazy load soit stable
async function autoScroll(page) {
  let stableCount = 0;
  let lastCount = -1;

  for (let i = 0; i < 80; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(700);

    // On compte les images pour détecter la stabilité
    const count = await page.evaluate(() =>
      document.querySelectorAll("img[alt]").length
    );

    if (count === lastCount) {
      stableCount++;
      if (stableCount >= 4) break;
    } else {
      stableCount = 0;
    }
    lastCount = count;
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
}

function buildNaSearchUrl(titleText) {
  const url = new URL(NA_BASE);
  url.searchParams.set("search", "true");
  url.searchParams.set("selectTitle", titleText);
  return url.href;
}

function buildJpSearchUrl(seriesValue) {
  const url = new URL(JP_BASE);
  url.searchParams.set("search", "true");
  url.searchParams.set("series", seriesValue);
  return url.href;
}

async function getNaTitleOptions(page) {
  await gotoStable(page, `${NA_BASE}?search=true`);

  return await page.evaluate(() => {
    const sel = document.querySelector("select");
    if (!sel) return [];
    return [...sel.options]
      .map((o) => ({
        text: (o.textContent || "").trim(),
        value: (o.value || "").trim(),
      }))
      .filter((o) => o.text)
      .filter((o) => {
        const t = o.text.toLowerCase();
        return (
          t !== "select title" &&
          t !== "all" &&
          t !== "union arena" &&
          t !== "title" &&
          t !== "タイトルを選択"
        );
      });
  });
}

// Lecture directe des cartes depuis les <img> dans le DOM — pas de clic nécessaire
async function extractCardsFromDOM(page, title, region) {
  return await page.evaluate(({ title, region }) => {
    const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

    const parseRarity = (text) =>
      text.match(/\b(SEC|SR\+\+|SR\+|SR|UR|R|U|C|AP|SP)\b/)?.[1] || "";

    const abs = (src) => {
      try { return new URL(src, location.href).href; } catch { return src || ""; }
    };

    const cards = [];

    for (const img of document.querySelectorAll("img[alt]")) {
      const alt = norm(img.getAttribute("alt") || "");

      // Format attendu : "UE01BT/BLC-1-001 Asguiaro Ebern"
      const m = alt.match(/^([A-Z0-9]+\/[A-Z0-9\-]+(?:\u2605)?)\s+(.+)$/i);
      if (!m) continue;

      const cardNumber = norm(m[1]);
      const name = norm(m[2]);

      const src =
        img.getAttribute("src") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("data-original") ||
        img.currentSrc ||
        "";

      if (!src) continue;

      cards.push({
        title,
        region,
        cardNumber,
        name,
        rarity: parseRarity(alt),
        product: cardNumber.split("/")[0] || "",
        image: abs(src),
      });
    }

    return cards;
  }, { title, region });
}

// NA : tout est en lazy load sur une seule page
async function collectAllCardsNA(page, startUrl, title, region) {
  await gotoStable(page, startUrl);
  await autoScroll(page);

  const cards = await extractCardsFromDOM(page, title, region);
  console.log(`   ↳ ${cards.length} cartes trouvées`);

  return cards;
}

// JP : page 1 uniquement (cartes parallèles)
async function collectAllCardsJP(page, startUrl, title, region) {
  await gotoStable(page, startUrl);
  await sleep(1000);

  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll("img[alt]")];
    return imgs.some(img => /^[A-Z0-9]+\/[A-Z0-9\-]+/i.test(img.getAttribute("alt") || ""));
  }, { timeout: 10000 }).catch(() => {});

  await autoScroll(page);
  const cards = await extractCardsFromDOM(page, title, region);
  console.log(`   ↳ ${cards.length} cartes trouvées`);
  return cards;
}

function buildStableLocalId(card) {
  // localId propre : juste le numéro de carte slugifié, sans __ ni /
  // ex: "UE01BT/BLC-1-001" -> "ue01bt-blc-1-001"
  return slugify(card.cardNumber || card.name || "unknown");
}

async function buildNaCatalog(page) {
  const titleOptions = await getNaTitleOptions(page);

  console.log("🌍 Catalogue NA détecté :");
  titleOptions.forEach((o) => console.log(` - ${o.text} [${o.value}]`));

  const sets = [];
  const cards = [];

  for (const opt of titleOptions) {
    const setName = opt.text;
    const setId = `unionarena-na-${slugify(setName)}`;

    console.log(`\n📚 [NA] ${setName}`);
    const startUrl = buildNaSearchUrl(opt.text);
    console.log(`   ↳ fetch ${startUrl}`);

    const extracted = await collectAllCardsNA(page, startUrl, setName, "na");

    sets.push({ id: setId, name: setName, region: "na", game: "unionarena" });

    for (const card of extracted) {
      const localId = buildStableLocalId(card);
      let image = card.image;
      let imageHigh = card.image;

      if (WITH_IMAGES && card.image) {
        try {
          const imageUrl = new URL(card.image);
          const imageExt = path.extname(imageUrl.pathname) || ".png";
          const localImageName = `${setId}__${slugify(localId)}${imageExt}`;
          const localImagePath = path.join(IMG_DIR, localImageName);

          if (!fs.existsSync(localImagePath)) {
            await downloadImage(card.image, localImagePath);
            await sleep(20);
          }

          image = `/data/unionarena/images/${localImageName}`;
          imageHigh = image;
        } catch (e) {
          console.warn(`⚠️ image skip: ${card.image} (${e.message})`);
        }
      }

      cards.push({
        game: "unionarena",
        region: "na",
        setId,
        setName,
        cardId: `${setId}-${localId}`,
        localId,
        name: card.name || localId,
        rarity: card.rarity || "",
        product: card.product || "",
        image,
        imageHigh,
      });
    }

    await sleep(300);
  }

  return {
    sets: uniqueBy(sets, (x) => x.id),
    cards: uniqueBy(cards, (x) => x.cardId),
  };
}

async function buildJpCatalog(page) {
  console.log("\n🗾 JP séries ciblées :");
  TARGET_JP_SERIES.forEach((o) => console.log(` - ${o.title} (${o.series})`));

  const sets = [];
  const cards = [];

  for (const opt of TARGET_JP_SERIES) {
    const setName = opt.title;
    const setId = `unionarena-jp-${slugify(setName)}`;

    console.log(`\n📚 [JP] ${setName}`);
    const startUrl = buildJpSearchUrl(opt.series);
    console.log(`   ↳ fetch ${startUrl}`);

    const extracted = await collectAllCardsJP(page, startUrl, setName, "jp");

    sets.push({ id: setId, name: setName, region: "jp", game: "unionarena" });

    for (const card of extracted) {
      const localId = buildStableLocalId(card);
      let image = card.image;
      let imageHigh = card.image;

      if (WITH_IMAGES && card.image) {
        try {
          const imageUrl = new URL(card.image);
          const imageExt = path.extname(imageUrl.pathname) || ".png";
          const localImageName = `${setId}__${slugify(localId)}${imageExt}`;
          const localImagePath = path.join(IMG_DIR, localImageName);

          if (!fs.existsSync(localImagePath)) {
            await downloadImage(card.image, localImagePath);
            await sleep(20);
          }

          image = `/data/unionarena/images/${localImageName}`;
          imageHigh = image;
        } catch (e) {
          console.warn(`⚠️ image skip: ${card.image} (${e.message})`);
        }
      }

      cards.push({
        game: "unionarena",
        region: "jp",
        setId,
        setName,
        cardId: `${setId}-${localId}`,
        localId,
        name: card.name || localId,
        rarity: card.rarity || "",
        product: card.product || "",
        image,
        imageHigh,
      });
    }

    await sleep(300);
  }

  return {
    sets: uniqueBy(sets, (x) => x.id),
    cards: uniqueBy(cards, (x) => x.cardId),
  };
}

async function main() {
  ensureDir(OUT_DIR);
  if (WITH_IMAGES) ensureDir(IMG_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 2200 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const page = await context.newPage();

  try {
    const naCatalog = await buildNaCatalog(page);
    const jpCatalog = await buildJpCatalog(page);

    const allSets = uniqueBy([...naCatalog.sets, ...jpCatalog.sets], (x) => x.id);
    const allCards = uniqueBy([...naCatalog.cards, ...jpCatalog.cards], (x) => x.cardId);

    fs.writeFileSync(OUT_SETS, JSON.stringify(allSets, null, 2), "utf8");
    fs.writeFileSync(OUT_CARDS, JSON.stringify(allCards, null, 2), "utf8");

    console.log("\n✅ Terminé");
    console.log(`📦 Sets: ${allSets.length}`);
    console.log(`🃏 Cards: ${allCards.length}`);
    console.log(`📁 ${OUT_SETS}`);
    console.log(`📁 ${OUT_CARDS}`);
    if (WITH_IMAGES) console.log(`🖼️ Images: ${IMG_DIR}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
