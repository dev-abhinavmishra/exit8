import { chromium } from "playwright";
const NA = "window.__nightaudit";
const browser = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"] });
async function boot(seed, anomaly) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await p.goto(`http://localhost:5199/?e2e=1&engine=webgl&seed=${seed}&anomaly=${anomaly}`);
  await p.waitForFunction(`(${NA}) && (${NA}).ready === true`, null, { timeout: 90000 });
  await p.getByRole("button", { name: /BEGIN SHIFT/ }).click();
  await p.waitForFunction(`(${NA}).state() === "playing"`, null, { timeout: 20000 });
  await p.waitForTimeout(4500);
  return p;
}
{ const p = await boot("capx", "cap.lit");
  await p.evaluate(`${NA}.teleport(0, 0, 58.6, 0)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-caplit.png" });
  console.log("slit:", await p.evaluate(`${NA}.meshInfo('anomaly.caplit.slit')`));
  await p.close(); }
{ const p = await boot("benchx", "none");
  await p.evaluate(`${NA}.teleport(0.5, 0, 43.6)`);
  await p.evaluate(`${NA}.look(-1.15, 0.1)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-bench.png" });
  await p.close(); }
await browser.close(); console.log("done");
