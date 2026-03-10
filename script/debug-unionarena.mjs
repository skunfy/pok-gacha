// debug-unionarena.mjs
import { chromium } from "playwright";

const page_url = "https://www.unionarena-tcg.com/na/cardlist/index.php?search=true&selectTitle=BLEACH%3A+Thousand-Year+Blood+War";

const browser = await chromium.launch({ headless: false }); // headless: false pour voir le navigateur
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});
const page = await context.newPage();

await page.goto(page_url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForLoadState("networkidle").catch(() => {});
await new Promise(r => setTimeout(r, 3000));

// Scroll lent
for (let i = 0; i < 10; i++) {
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 800));
}

// Inspecter ce qu'il y a dans le DOM
const info = await page.evaluate(() => {
  const allAnchors = [...document.querySelectorAll("a")].map(a => a.getAttribute("href")).filter(Boolean);
  const groupAnchors = allAnchors.filter(h => h.startsWith("#group_"));
  const cardImages = [...document.querySelectorAll("img")].filter(img => img.getAttribute("alt")?.match(/[A-Z0-9]+\/[A-Z0-9-]+/));
  const cardLinks = [...document.querySelectorAll("a")].filter(a => a.href?.includes("card"));

  return {
    totalAnchors: allAnchors.length,
    groupAnchors: groupAnchors.slice(0, 10),
    groupAnchorsCount: groupAnchors.length,
    cardImagesCount: cardImages.length,
    cardImagesSample: cardImages.slice(0, 3).map(img => ({ alt: img.alt, src: img.src })),
    cardLinksCount: cardLinks.length,
    cardLinksSample: cardLinks.slice(0, 3).map(a => a.href),
    bodySnippet: document.body.innerHTML.slice(0, 2000),
  };
});

console.log(JSON.stringify(info, null, 2));

await browser.close();