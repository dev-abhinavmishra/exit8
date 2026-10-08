import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NA = "window.__nightaudit";

// Ids are scraped from the def files rather than importing ALL_ANOMALIES —
// the index pulls Babylon's extension-less ESM paths into the Playwright
// node process, which cannot resolve them (Vite-only resolution).
const ANOMALY_DIR = join(process.cwd(), "src/game/anomalies");
const IDS = readdirSync(ANOMALY_DIR)
  .filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "types.ts")
  .flatMap((f) => {
    const s = readFileSync(join(ANOMALY_DIR, f), "utf8");
    const m = s.match(/export const \w+:\s*AnomalyDef\s*=\s*\{[\s\S]*?id:\s*"([^"]+)"/);
    return m ? [m[1]] : [];
  });

// Catches the silent-skip class: a `requires` entry that names a node the
// registry never registered makes loopManager drop the anomaly (console
// warning only) — the route runs clean and the divergence never fires.
// ~8-20 min: a fresh navigation per def, as the seed query is read at boot.
test("every catalog anomaly activates when forced", async ({ page }) => {
  test.setTimeout(35 * 60_000);
  const failed: string[] = [];
  for (const id of IDS) {
    let reason = "";
    const onConsole = (m: { text(): string }) => {
      const t = m.text();
      if (t.includes("missing registry node")) reason = t;
    };
    page.on("console", onConsole);
    try {
      await page.goto(`/?e2e=1&seed=sweep&anomaly=${id}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, { timeout: 60_000 });
      await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
      await page.waitForFunction(`${NA}.loop() === 1`, null, { timeout: 30_000 });
      const active = await page.evaluate(`${NA}.anomaly()`);
      if (active !== id) reason ||= `active=${JSON.stringify(active)}`;
    } catch (e) {
      reason ||= String(e).split("\n")[0] ?? "error";
    }
    page.off("console", onConsole);
    if (reason) failed.push(`${id}: ${reason}`);
  }
  expect(failed).toEqual([]);
});
