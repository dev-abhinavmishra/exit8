import { test, expect } from "@playwright/test";

// The e2e param pins the Low tier, so the rest of the suite never runs
// the post pipeline (bloom/grain/CA/vignette/tone mapping). This spec
// overrides with ?quality=high and proves the pipeline path boots,
// renders, and lets a run start — a break there would be invisible to
// the chromium suite otherwise.
test.describe("high tier post pipeline", () => {
  test("boots the full pipeline, renders, and starts a shift", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/?e2e=1&quality=high&seed=postfx.boot");
    await page.waitForFunction("window.__nightaudit && window.__nightaudit.ready === true", undefined, {
      timeout: 120_000,
    });
    await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
    await page.waitForFunction("window.__nightaudit.loop() === 1", undefined, { timeout: 40_000 });
    const draws = await page.evaluate(async () => {
      const app = window.__nightaudit;
      const d0 = app.draws();
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      return app.draws() - d0;
    });
    expect(draws).toBeGreaterThan(30); // the corridor is actually drawing
    expect(errors).toEqual([]);
  });
});
