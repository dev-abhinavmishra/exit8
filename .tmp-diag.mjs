import { chromium } from "playwright";
const browser = await chromium.launch({
  args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on("pageerror", e => console.log("PAGEERROR:", e.message));
page.on("console", m => { const t = m.text(); if (!t.includes("Download the React DevTools")) console.log("CON:", t.slice(0,300)); });
await page.goto("http://localhost:5199/?e2e=1&engine=webgl&seed=stair1&anomaly=service.stairwell");
await page.waitForTimeout(25000);
console.log("NA:", await page.evaluate("typeof window.NA"));
await page.screenshot({ path: ".tmp-diag.png" });
await browser.close();
