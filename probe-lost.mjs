import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader-webgl", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5199/?e2e=1&seed=audit.lost.1", { waitUntil: "networkidle" });
await page.click("text=BEGIN SHIFT");
await page.waitForFunction(() => window.__nightaudit?.loop() === 1, null, { timeout: 30000 });
const na = (expr) => page.evaluate(`window.__nightaudit.${expr}`);
await na("setStability(20)");
for (let i = 0; i < 6; i++) {
  const stab = await na("stability()");
  if (stab <= 0) break;
  const loop = await na("loop()");
  const anom = await na("anomaly()");
  // always file WRONG: retreat on clean, continue on anomalous
  await na(anom ? "teleport(0, 1.7, 59, 0)" : "teleport(0, 1.7, -4, Math.PI)");
  await page.waitForFunction((l) => window.__nightaudit.loop() !== l || window.__nightaudit.stability() <= 0, loop, { timeout: 15000 }).catch(() => {});
}
console.log("stability:", await na("stability()"), "loop:", await na("loop()"));
// the drowned ending: watch from mid-corridor looking at the filed side
const anom = await na("anomaly()");
const side = anom ? 0 : Math.PI; // anomalous→continue→south... actually last commit side; just look both
await na(`teleport(0, 1.7, 30, ${side})`);
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/lost-a.png" });
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/lost-b.png" });
console.log("errors:", errors);
await browser.close();
