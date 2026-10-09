import { chromium } from "playwright";

const NA = "window.__nightaudit";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});

async function boot(seed, anomaly) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.log(`PAGEERROR[${anomaly}]:`, e.message));
  await page.goto(`http://localhost:5199/?e2e=1&engine=webgl&seed=${seed}&anomaly=${anomaly}`);
  await page.waitForFunction(`(${NA}) && (${NA}).ready === true`, null, { timeout: 90000 });
  await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
  await page.waitForFunction(`(${NA}).state() === "playing"`, null, { timeout: 20000 });
  await page.waitForTimeout(4500); // title card fades ~4s
  return page;
}

// 1) stairwell OPEN from beyond slam range — face the east door from the west lane
{
  const p = await boot("a7stair", "service.stairwell");
  await p.evaluate(`${NA}.teleport(-0.6, 0, 9.5, -1.05)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-stair-open.png" });
  console.log("stair open leaf rot:", await p.evaluate(`${NA}.meshInfo('service.door.leaf').rot[1]`));
  await p.close();
}

// 2) vent.loose — grille at east z30, tilted + duct hole
{
  const p = await boot("a7vent", "vent.loose");
  await p.evaluate(`${NA}.teleport(0.3, 0, 27.5, -1.35)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-vent.png" });
  console.log("grille rot:", await p.evaluate(`${NA}.meshInfo('vent.grille.1')`));
  await p.close();
}

// 3) cap.lit — warm slit under the south cap, seen in the commit walk's last metres
{
  const p = await boot("a7cap", "cap.lit");
  await p.evaluate(`${NA}.teleport(0, 0, 56.5, 0)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-caplit.png" });
  await p.close();
}

// 4) corridor.mirror — ARCHIVES fascia + records bank should sit on the EAST wall,
//    light pools on flipped fixtures (they're scene-level, previously unmoved)
{
  const p = await boot("a7mir", "corridor.mirror");
  await p.evaluate(`${NA}.teleport(0.4, 0, 22, -1.2)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-mirror.png" });
  await p.close();
}

// 5) workbench vignette — west wall z42-45.5
{
  const p = await boot("a7bench", "none");
  await p.evaluate(`${NA}.teleport(0.6, 0, 41.2, 1.0)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-bench.png" });
  await p.close();
}

await browser.close();
console.log("done");
