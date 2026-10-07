import { test, expect } from "@playwright/test";

// Cross-browser smoke: only runs under `--project firefox|webkit` (XB=1
// npx playwright test). Chromium's full suite covers the mechanics;
// these specs prove the engine actually boots, renders, moves, and
// judges on the other two renderer paths (Firefox WebGL2, WebKit WebGL2).
test.describe("cross-browser smoke", () => {
  test("boots, starts a shift, moves, and renders the corridor", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/?e2e=1&seed=xb.smoke");
    await page.waitForFunction("window.__nightaudit && window.__nightaudit.ready === true", undefined, {
      timeout: 90_000,
    });
    await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
    await page.waitForFunction("window.__nightaudit.loop() === 1", undefined, { timeout: 30_000 });
    const p0 = await page.evaluate(() => window.__nightaudit.pos());
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1_500);
    await page.keyboard.up("KeyW");
    const p1 = await page.evaluate(() => window.__nightaudit.pos());
    expect(p1.z).toBeGreaterThan(p0.z + 0.4);
    expect(errors).toEqual([]);
  });

  test("a judgment at the south line resolves without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/?e2e=1&seed=xb.smoke.judge");
    await page.waitForFunction("window.__nightaudit && window.__nightaudit.ready === true", undefined, {
      timeout: 90_000,
    });
    await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
    await page.waitForFunction("window.__nightaudit.loop() === 1", undefined, { timeout: 30_000 });
    await page.evaluate(() => {
      window.__nightaudit.teleport(0, 0, 58);
    });
    await page.waitForFunction("window.__nightaudit.loop() === 2", undefined, { timeout: 40_000 });
    expect(errors).toEqual([]);
  });
});
