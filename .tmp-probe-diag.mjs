import { chromium } from "playwright";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE:", m.text().slice(0, 160)); });
await page.goto("http://localhost:5199/?e2e=1&engine=webgl&seed=diag1");
for (let i = 0; i < 24; i++) {
  const st = await page.evaluate("window.NA && NA.state ? NA.state() : 'no-NA'").catch(() => "eval-fail");
  console.log(`t+${i * 10}s state=${st}`);
  if (st === "playing") break;
  await page.waitForTimeout(10000);
}
await browser.close();
