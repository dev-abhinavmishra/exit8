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
  await page.waitForTimeout(4500);
  return page;
}

// stairwell OPEN — east wall service door at z15.5, from the west lane facing east
{
  const p = await boot("a7stair", "service.stairwell");
  await p.evaluate(`${NA}.teleport(-0.4, 0, 15.2, 1.35)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-stair-open.png" });
  await p.close();
}

// vent.loose — grille east z30
{
  const p = await boot("a7vent", "vent.loose");
  await p.evaluate(`${NA}.teleport(0.4, 0, 29.6, 1.35)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-vent.png" });
  await p.close();
}

// corridor.mirror — now the records/ARCHIVES run is on the EAST side
{
  const p = await boot("a7mir", "corridor.mirror");
  await p.evaluate(`${NA}.teleport(-0.4, 0, 24, 1.2)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-mirror.png" });
  await p.close();
}

await browser.close();
console.log("done");
