import { test, expect } from "@playwright/test";
import { ALL_ANOMALIES } from "../../src/game/anomalies";

const NA = "window.__nightaudit";

// Catches the silent-skip class: a `requires` entry that names a node the
// registry never registered makes loopManager drop the anomaly (console
// warning only) — the route runs clean and the divergence never fires.
// ~8-10 min: a fresh navigation per def, as the seed query is read at boot.
test("every catalog anomaly activates when forced", async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const failed: string[] = [];
  for (const def of ALL_ANOMALIES) {
    let reason = "";
    const onConsole = (m: { text(): string }) => {
      const t = m.text();
      if (t.includes("missing registry node")) reason = t;
    };
    page.on("console", onConsole);
    try {
      await page.goto(`/?e2e=1&seed=sweep&anomaly=${def.id}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, { timeout: 60_000 });
      await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
      await page.waitForFunction(`${NA}.loop() === 1`, null, { timeout: 30_000 });
      const active = await page.evaluate(`${NA}.anomaly()`);
      if (active !== def.id) reason ||= `active=${JSON.stringify(active)}`;
    } catch (e) {
      reason ||= String(e).split("\n")[0] ?? "error";
    }
    page.off("console", onConsole);
    if (reason) failed.push(`${def.id}: ${reason}`);
  }
  expect(failed).toEqual([]);
});
