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

// stairwell OPEN — stay >4.2m from (1.68,15.5): at (-0.4,8.0) distance ≈ 7.8m
{
  const p = await boot("a7stair", "service.stairwell");
  await p.evaluate(`${NA}.teleport(-0.4, 0, 8.0)`);
  await p.evaluate(`${NA}.look(0.27, 0)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-stair-open.png" });
  console.log("leaf:", await p.evaluate(`${NA}.meshInfo('service.door.leaf').rot[1]`));
  await p.close();
}

// vent.loose — grille is at y≈2.79 near ceiling; pull back + pitch up
{
  const p = await boot("a7vent", "vent.loose");
  await p.evaluate(`${NA}.teleport(0.2, 0, 26.2)`);
  await p.evaluate(`${NA}.look(1.15, 0.55)`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: ".tmp-a7-vent.png" });
  await p.close();
}

await browser.close();
console.log("done");
