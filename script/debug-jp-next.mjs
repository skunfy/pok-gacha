// debug-jp-next.mjs
import { chromium } from "playwright";

const url = "https://www.unionarena-tcg.com/jp/cardlist/index.php?search=true&series=570140";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForLoadState("networkidle").catch(() => {});
await new Promise(r => setTimeout(r, 2000));

// Inspecte le bouton次へ avant le clic
const before = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("a[data-multi='card']")];
  return btns.map(b => ({ text: b.textContent.trim(), class: b.className, html: b.outerHTML.slice(0, 150) }));
});

console.log("=== BOUTONS AVANT CLIC ===");
console.log(JSON.stringify(before, null, 2));

// Clique次へ
await page.evaluate(() => {
  const btns = [...document.querySelectorAll("a[data-multi='card']")];
  const next = btns.find(b => b.textContent.trim() === "次へ");
  if (next) next.click();
});

await new Promise(r => setTimeout(r, 2500));

// Inspecte après le clic
const after = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("a[data-multi='card']")];
  // Première carte visible
  const firstCard = document.querySelector("img[alt]");
  return {
    buttons: btns.map(b => ({ text: b.textContent.trim(), class: b.className })),
    firstCardAlt: firstCard?.getAttribute("alt") || "none"
  };
});

console.log("\n=== APRES CLIC ===");
console.log(JSON.stringify(after, null, 2));

await browser.close();