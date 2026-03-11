// script/build-unionarena-playwright.mjs
// npm i -D playwright
// npx playwright install chromium
//
// Usage:
//   node script/build-unionarena-playwright.mjs
//   node script/build-unionarena-playwright.mjs --with-images

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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeSpace(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function slugify(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}★]+/gu, "-")
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

function isDummyImage(url) {
  return String(url || "").toLowerCase().includes("dummy.gif");
}

function parseUnionArenaCardNumber(cardNumber) {
  const raw = normalizeSpace(cardNumber).toUpperCase();
  const [product = "", suffix = ""] = raw.split("/");
  if (!product || !suffix) return null;
  return { product, suffix };
}

function buildUnionArenaLocalId(cardNumber) {
  const parsed = parseUnionArenaCardNumber(cardNumber);
  if (!parsed) return slugify(cardNumber);
  return `${parsed.product.toLowerCase()}-${parsed.suffix.toLowerCase()}`;
}

function buildUnionArenaSetId(region, title, cardNumber) {
  const parsed = parseUnionArenaCardNumber(cardNumber);
  const product = parsed?.product ? parsed.product.toLowerCase() : "unknown";
  return `unionarena-${region}-${slugify(title)}-${product}`;
}

function buildUnionArenaOfficialImageCandidates(cardNumber, region, variantIndex = 0) {
  const parsed = parseUnionArenaCardNumber(cardNumber);
  if (!parsed) return [];

  const base = `${parsed.product}_${parsed.suffix}`;
  const variantSuffix = variantIndex > 0 ? `_p${variantIndex}` : "";

  return [
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png?v7`,
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png?v6`,
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png?v5`,
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png?v4`,
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png?v3`,
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png?v2`,
    `https://www.unionarena-tcg.com/${region}/images/cardlist/card/${base}${variantSuffix}.png`,
  ];
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

async function urlExists(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        referer: "https://www.unionarena-tcg.com/",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function resolveBestUnionArenaImage(cardNumber, region, fallbackImage = "", variantIndex = 0) {
  const candidates = [
    ...buildUnionArenaOfficialImageCandidates(cardNumber, region, variantIndex),
    ...buildUnionArenaOfficialImageCandidates(cardNumber, region, 0),
  ];

  if (fallbackImage) {
    candidates.push(fallbackImage);
  }

  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

  for (const url of uniqueCandidates) {
    if (await urlExists(url)) return url;
  }

  return fallbackImage || uniqueCandidates[0] || "";
}

async function gotoStable(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(1200);
}

async function autoScroll(page) {
  let lastHeight = -1;
  for (let i = 0; i < 30; i++) {
    const h = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return document.body.scrollHeight;
    });
    await sleep(350);
    if (h === lastHeight) break;
    lastHeight = h;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
}

async function getNaTitleOptions(page) {
  await gotoStable(page, `${NA_BASE}?search=true`);

  const titles = await page.evaluate(() => {
    const sel = document.querySelector('select[name="selectTitle"]') || document.querySelector("select");
    if (!sel) return [];

    return [...sel.options]
      .map((o) => ({
        text: (o.textContent || "").trim(),
        value: (o.value || "").trim(),
      }))
      .filter((o) => o.text && o.value)
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

  return titles;
}

async function getJpSeriesOptions(page) {
  await gotoStable(page, `${JP_BASE}?search=true`);

  const series = await page.evaluate(() => {
    const sel = document.querySelector('select[name="series"]') || document.querySelector("select");
    if (!sel) return [];

    return [...sel.options]
      .map((o) => ({
        text: (o.textContent || "").trim(),
        value: (o.value || "").trim(),
      }))
      .filter((o) => o.text && o.value)
      .filter((o) => {
        const t = o.text.toLowerCase();
        return (
          t !== "select" &&
          t !== "all" &&
          t !== "title" &&
          t !== "作品を選択" &&
          t !== "タイトルを選択"
        );
      });
  });

  return series;
}

function buildNaSearchUrl(titleValue) {
  const url = new URL(NA_BASE);
  url.searchParams.set("search", "true");
  url.searchParams.set("selectTitle", titleValue);
  return url.href;
}

function buildJpSearchUrl(seriesValue) {
  const url = new URL(JP_BASE);
  url.searchParams.set("search", "true");
  url.searchParams.set("series", seriesValue);
  return url.href;
}

async function getPagerInfo(page) {
  return await page.evaluate(() => {
    const text = document.body.innerText || "";
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return { current: 1, total: 1 };
    return {
      current: Number(m[1]) || 1,
      total: Number(m[2]) || 1,
    };
  });
}

async function clickNext(page, prevPager) {
  const clicked = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("a, button, span, li, div")];
    const next = candidates.find((el) => {
      const txt = (el.textContent || "").trim().toLowerCase();
      const href = (el.getAttribute?.("href") || "").trim().toLowerCase();
      const cls = String(el.className || "").toLowerCase();

      if (cls.includes("disable") || cls.includes("disabled")) return false;

      return (
        txt === "next" ||
        txt === "次へ" ||
        txt.includes("next") ||
        href.includes("next")
      );
    });

    if (!next) return false;
    next.click();
    return true;
  });

  if (!clicked) return false;

  for (let i = 0; i < 20; i++) {
    await page.waitForLoadState("networkidle").catch(() => {});
    await sleep(500);
    const now = await getPagerInfo(page);
    if (now.current !== prevPager.current) return true;
  }

  return false;
}

async function collectCurrentPageCards(page, title, region, pageIndex) {
  return await page.evaluate(({ title, region, pageIndex }) => {
    const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

    const parseAlt = (alt) => {
      const m = norm(alt).match(/^([A-Z0-9]+\/[A-Z0-9-]+(?:★)?)\s+(.+)$/i);
      if (!m) return null;
      return {
        cardNumber: norm(m[1]),
        name: norm(m[2]),
      };
    };

    const parseRarity = (text) => {
      return text.match(/\b(SEC|SR\+\+|SR\+|SR|UR|R|U|C|AP|SP)\b/)?.[1] || "";
    };

    const abs = (src) => {
      try {
        return new URL(src, location.href).href;
      } catch {
        return src || "";
      }
    };

    const out = [];
    let ordinal = 0;

    for (const img of [...document.querySelectorAll("img[alt]")]) {
      const alt = norm(img.getAttribute("alt") || "");
      if (!alt) continue;

      const parsed = parseAlt(alt);
      if (!parsed) continue;

      const src =
        img.getAttribute("src") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("data-original") ||
        img.currentSrc ||
        "";

      const thumbImage = abs(src);

      out.push({
        title,
        region,
        name: parsed.name || parsed.cardNumber,
        cardNumber: parsed.cardNumber,
        rarity: parseRarity(alt),
        product: parsed.cardNumber.split("/")[0] || "",
        thumbImage,
        pageIndex,
        ordinal: ordinal++,
      });
    }

    return out;
  }, { title, region, pageIndex });
}

async function collectAllRenderedCards(page, startUrl, title, region) {
  await gotoStable(page, startUrl);

  const all = [];
  const visitedPages = new Set();

  for (let round = 0; round < 80; round++) {
    await autoScroll(page);

    const pager = await getPagerInfo(page);
    const pageSignature = `${pager.current}/${pager.total}`;
    if (visitedPages.has(pageSignature)) break;
    visitedPages.add(pageSignature);

    const cards = await collectCurrentPageCards(page, title, region, pager.current);
    console.log(`   ↳ page ${pager.current}/${pager.total}: ${cards.length} cartes détectées`);

    for (const card of cards) {
      all.push(card);
    }

    if (pager.current >= pager.total) break;

    const moved = await clickNext(page, pager);
    if (!moved) break;
  }

  return all;
}

async function maybeDownloadImage(image, setId, localId) {
  if (!WITH_IMAGES || !image || isDummyImage(image)) {
    return image;
  }

  try {
    const imageUrl = new URL(image);
    const imageExt = path.extname(imageUrl.pathname) || ".png";
    const localImageName = `${setId}__${slugify(localId)}${imageExt}`;
    const localImagePath = path.join(IMG_DIR, localImageName);

    if (!fs.existsSync(localImagePath)) {
      await downloadImage(image, localImagePath);
      await sleep(20);
    }

    return `/data/unionarena/images/${localImageName}`;
  } catch (e) {
    console.warn(`⚠️ image skip: ${image} (${e.message})`);
    return image;
  }
}

async function buildCatalogForEntries(page, entries, region) {
  const sets = [];
  const cards = [];

  for (const entry of entries) {
    const setName = entry.title;

    console.log(`\n📚 [${region.toUpperCase()}] ${setName}`);
    const startUrl =
      region === "na"
        ? buildNaSearchUrl(entry.value)
        : buildJpSearchUrl(entry.series);

    console.log(`   ↳ fetch ${startUrl}`);

    const extracted = await collectAllRenderedCards(page, startUrl, setName, region);
    console.log(`🃏 ${extracted.length} cartes trouvées`);

    const cardsForSet = [];
    const seenPerCardNumber = new Map();

    for (const card of extracted) {
      const localIdBase = buildUnionArenaLocalId(card.cardNumber);
      const setId = buildUnionArenaSetId(region, setName, card.cardNumber);

      const count = seenPerCardNumber.get(card.cardNumber) || 0;
      seenPerCardNumber.set(card.cardNumber, count + 1);

      const variantIndex = count;
      const variantSuffix = variantIndex > 0 ? `-p${variantIndex}` : "";
      const localId = `${localIdBase}${variantSuffix}`;

      const resolvedImage = await resolveBestUnionArenaImage(
        card.cardNumber,
        region,
        card.thumbImage || "",
        variantIndex
      );

      let image = resolvedImage;
      let imageHigh = resolvedImage;

      if (WITH_IMAGES && image) {
        const downloaded = await maybeDownloadImage(image, setId, localId);
        image = downloaded;
        imageHigh = downloaded;
      }

      cardsForSet.push({
        game: "unionarena",
        region,
        setId,
        setName,
        cardId: `${region}__${setId}__${localId}`,
        localId,
        name: card.name || localId,
        rarity: card.rarity || "",
        product: card.product || "",
        image,
        imageHigh,
      });
    }

    const uniqueCardsForSet = uniqueBy(cardsForSet, (x) => x.cardId);

    if (uniqueCardsForSet.length) {
      const setIds = uniqueBy(uniqueCardsForSet.map((x) => x.setId), (x) => x);
      for (const id of setIds) {
        const first = uniqueCardsForSet.find((x) => x.setId === id);
        sets.push({
          id,
          name: setName,
          region,
          game: "unionarena",
          product: first?.product || "",
        });
      }
    }

    cards.push(...uniqueCardsForSet);
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
    const naTitles = await getNaTitleOptions(page);
    console.log("🌍 Catalogue NA détecté :");
    naTitles.forEach((o) => console.log(` - ${o.text} [${o.value}]`));

    const jpSeries = await getJpSeriesOptions(page);
    console.log("\n🗾 Catalogue JP détecté :");
    jpSeries.forEach((o) => console.log(` - ${o.text} [${o.value}]`));

    const naCatalog = await buildCatalogForEntries(
      page,
      naTitles.map((x) => ({ title: x.text, value: x.value })),
      "na"
    );

    const jpCatalog = await buildCatalogForEntries(
      page,
      jpSeries.map((x) => ({ title: x.text, series: x.value })),
      "jp"
    );

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