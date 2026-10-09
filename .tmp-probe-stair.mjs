import { chromium } from "playwright";

const url = "http://localhost:5199/?e2e=1&engine=webgl&seed=stair1&anomaly=service.stairwell";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto(url);
await page.waitForFunction(() => window.NA && window.NA.state && window.NA.state() === "playing", null, {
  timeout: 150000,
});
await page.waitForTimeout(1200);

// 1) the reveal — lit stairwell through the open door, ~7m out
await page.evaluate("NA.teleport(0.4, 0, 9.0, 0.25)");
await page.waitForTimeout(400);
await page.screenshot({ path: ".tmp-stair-open.png" });
console.log("open leaf:", await page.evaluate("NA.meshInfo('service.door.leaf')"));

// 2) cross the 4.2m radius — the slam
await page.evaluate("NA.teleport(0.6, 0, 11.5, 0.35)");
await page.waitForTimeout(300);
await page.screenshot({ path: ".tmp-stair-mid.png" });
await page.waitForTimeout(700);
await page.screenshot({ path: ".tmp-stair-slammed.png" });
console.log("shut leaf:", await page.evaluate("NA.meshInfo('service.door.leaf')"));

// 3) close-up of the sealed door
await page.evaluate("NA.teleport(1.0, 0, 13.6, 0.9)");
await page.waitForTimeout(400);
await page.screenshot({ path: ".tmp-stair-close.png" });
await browser.close();
