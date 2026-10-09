import { chromium } from "playwright";

const NA = "window.__nightaudit";
const url = "http://localhost:5199/?e2e=1&engine=webgl&seed=stair1&anomaly=service.stairwell";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto(url);
await page.waitForFunction(`(${NA}) && (${NA}).ready === true`, null, { timeout: 90000 });
await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
await page.waitForFunction(`(${NA}).state() === "playing"`, null, { timeout: 20000 });
await page.waitForTimeout(1200);

// 1) the reveal — lit stairwell through the open door, ~7m out
await page.evaluate(`${NA}.teleport(0.4, 0, 9.0, -0.9)`);
await page.waitForTimeout(400);
await page.screenshot({ path: ".tmp-stair-open.png" });
console.log("open leaf:", await page.evaluate(`${NA}.meshInfo('service.door.leaf')`));

// 2) approach to slam range
await page.evaluate(`${NA}.teleport(0.9, 0, 12.4, -0.95)`);
await page.waitForTimeout(300);
await page.screenshot({ path: ".tmp-stair-mid.png" });

// 3) inside slam distance — wait for the slam
await page.evaluate(`${NA}.teleport(1.15, 0, 14.0, -1.1)`);
await page.waitForTimeout(1200);
await page.screenshot({ path: ".tmp-stair-slammed.png" });
console.log("after slam leaf:", await page.evaluate(`${NA}.meshInfo('service.door.leaf')`));
console.log("stair enabled:", await page.evaluate(`${NA}.meshInfo('anomaly.stair.landing')`));

// 4) sealed view
await page.screenshot({ path: ".tmp-stair-close.png" });
await browser.close();
console.log("done");
