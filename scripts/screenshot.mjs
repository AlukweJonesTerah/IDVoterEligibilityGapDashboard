import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium-browser", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
for (const p of process.argv.slice(2)) {
  await page.goto(`http://127.0.0.1:3002/${p === "overview" ? "" : p}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/pw-${p}.png` });
  console.log("shot", p);
}
await browser.close();
