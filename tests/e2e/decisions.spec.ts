import { test, expect, type Page } from "@playwright/test";

// window.__nightaudit is the debug handle installed by src/debug/handle.ts.
// waitForFunction takes a string predicate evaluated in-page; evaluate takes
// small inline functions that reference the handle directly.
const NA = "window.__nightaudit";

const stability = (page: Page) => page.evaluate(`${NA}.stability()`) as Promise<number>;
const anomaly = (page: Page) => page.evaluate(`${NA}.anomaly()`) as Promise<string | null>;

async function boot(page: Page, params: string) {
  await page.goto(`/?e2e=1&engine=webgl&seed=e2e-decide${params}`);
  await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, {
    timeout: 60_000,
  });
  await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
  await page.waitForFunction(`${NA}.state() === "playing"`);
}

test.describe("judgment", () => {
  test("clear route + continue (south) raises stability", async ({ page }) => {
    await boot(page, "&anomaly=none");
    const s0 = await stability(page);
    await page.evaluate(`${NA}.teleport(0, 0, 58)`);
    await page.waitForFunction(`${NA}.state() === "playing" && ${NA}.pos().z < 0`, null, { timeout: 20_000 });
    expect(await stability(page)).toBeGreaterThan(s0);
  });

  test("anomalous route + retreat (north) raises stability and logs discovery", async ({ page }) => {
    await boot(page, "&anomaly=clock.reverse");
    expect(await anomaly(page)).toBe("clock.reverse");
    const s0 = await stability(page);
    await page.evaluate(`${NA}.teleport(0, 0, -2.95)`);
    await page.waitForFunction(`${NA}.state() === "playing" && ${NA}.pos().z > -2.6`, null, {
      timeout: 20_000,
    });
    expect(await stability(page)).toBeGreaterThan(s0);
    const discovered = await page.evaluate(() => {
      const raw = localStorage.getItem("nightaudit.save");
      return raw ? (JSON.parse(raw) as { progression: { discovered: string[] } }).progression.discovered : [];
    });
    expect(discovered).toContain("clock.reverse");
  });

  test("anomalous route + continue is an error (stability drops)", async ({ page }) => {
    await boot(page, "&anomaly=doorway.extra");
    const s0 = await stability(page);
    await page.evaluate(`${NA}.teleport(0, 0, 58)`);
    await page.waitForFunction(`${NA}.state() === "playing" && ${NA}.pos().z < 0`, null, { timeout: 20_000 });
    expect(await stability(page)).toBeLessThan(s0);
  });

  test("clear route + retreat is a false alarm (stability drops)", async ({ page }) => {
    await boot(page, "&anomaly=none");
    const s0 = await stability(page);
    await page.evaluate(`${NA}.teleport(0, 0, -2.95)`);
    await page.waitForFunction(`${NA}.state() === "playing" && ${NA}.pos().z > -2.6`, null, {
      timeout: 20_000,
    });
    expect(await stability(page)).toBeLessThan(s0);
  });

  test("full run to ROUTE SECURED shows the report", async ({ page }) => {
    test.setTimeout(180_000);
    await boot(page, "&anomaly=none");
    for (let i = 0; i < 6; i++) {
      await page.evaluate(`${NA}.forceAnomaly("none")`);
      await page.evaluate(`${NA}.teleport(0, 0, 58)`);
      const done = await page
        .waitForFunction(`${NA}.state() === "results"`, null, { timeout: 12_000 })
        .then(() => true)
        .catch(() => false);
      if (done) break;
      await page.waitForFunction(`${NA}.state() === "playing" && ${NA}.pos().z < 0`, null, {
        timeout: 12_000,
      });
    }
    await expect(page.locator("text=ROUTE SECURED")).toBeVisible({ timeout: 15_000 });
  });
});
