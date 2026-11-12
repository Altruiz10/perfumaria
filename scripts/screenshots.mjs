// Visual check: node scripts/screenshots.mjs <outDir>  (server must be running on :3100)
import { chromium, devices } from "@playwright/test";

const OUT = process.argv[2] ?? "screenshots";
const B = process.env.BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const errors = [];

async function open(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage();
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} :: ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`${p.url()} :: ${e}`));
  p.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  return p;
}

const m = await open({ ...devices["Pixel 7"] });
await m.goto(`${B}/pt`, { waitUntil: "load" });
await m.waitForTimeout(2200);
await m.screenshot({ path: `${OUT}/m-home.png` });
await m.getByTestId("cookie-accept").click();
await m.screenshot({ path: `${OUT}/m-home-full.png`, fullPage: true });
await m.goto(`${B}/pt/perfume/noir-absolu`, { waitUntil: "load" });
await m.screenshot({ path: `${OUT}/m-product.png` });
await m.getByTestId("add-to-bag").click();
await m.waitForTimeout(800);
await m.screenshot({ path: `${OUT}/m-cart.png` });
await m.goto(`${B}/pt/colecao`, { waitUntil: "load" });
await m.screenshot({ path: `${OUT}/m-collection.png` });
await m.getByLabel("Abrir menu").click();
await m.waitForTimeout(800);
await m.screenshot({ path: `${OUT}/m-menu.png` });

const d = await open({ viewport: { width: 1440, height: 900 } });
await d.goto(`${B}/pt`, { waitUntil: "load" });
await d.waitForTimeout(2200);
await d.screenshot({ path: `${OUT}/d-home.png` });
await d.getByTestId("cookie-accept").click();
await d.screenshot({ path: `${OUT}/d-home-full.png`, fullPage: true });
await d.goto(`${B}/pt/perfume/ambar-imperial`, { waitUntil: "load" });
await d.screenshot({ path: `${OUT}/d-product.png` });
await d.getByTestId("theme-toggle").first().click();
await d.waitForTimeout(800);
await d.screenshot({ path: `${OUT}/d-product-dark.png` });
await d.goto(`${B}/pt/colecao`, { waitUntil: "load" });
await d.screenshot({ path: `${OUT}/d-collection-dark.png` });
await d.goto(`${B}/pt/finalizar`, { waitUntil: "load" });
await d.screenshot({ path: `${OUT}/d-checkout-dark.png` });

console.log("console errors:", errors.length ? errors : "none");
await browser.close();
