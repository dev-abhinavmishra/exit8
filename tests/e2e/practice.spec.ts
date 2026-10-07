import { test, expect, type Page } from "@playwright/test";

const NA = "window.__nightaudit";

const stability = (page: Page) => page.evaluate(`${NA}.stability()`) as Promise<number>;
const anomaly = (page: Page) => page.evaluate(`${NA}.anomaly()`) as Promise<string | null>;

async function boot(page: Page, params: string) {
  await page.goto(`/?e2e=1&engine=webgl&seed=e2e-practice&practice=1${params}`);
  await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, {
    timeout: 60_000,
  });
  await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
  await page.waitForFunction(`${NA}.state() === "playing"`);
}

test.describe("practice mode", () => {
  test("stability clamps instead of ending the run", async ({ page }) => {
    await boot(page, "&anomaly=clock.reverse");
    // a correct retreat at 95 would secure a real run — practice clamps
    await page.evaluate(`${NA}.setStability(95)`);
    await page.evaluate(`${NA}.teleport(0, 0, -2.95)`);
    await page.waitForFunction(`${NA}.loop() === 2`, null, { timeout: 40_000 });
    expect(await page.evaluate(`${NA}.state()`)).toBe("playing");
    expect(await stability(page)).toBeLessThan(90);
    // a wrong call at 5 would lose a real run — practice clamps low
    await page.evaluate(`${NA}.setStability(5)`);
    const a2 = await anomaly(page);
    await page.evaluate(`${NA}.teleport(0, 0, ${a2 ? 58 : -2.95})`);
    await page.waitForFunction(`${NA}.loop() === 3`, null, { timeout: 40_000 });
    expect(await page.evaluate(`${NA}.state()`)).toBe("playing");
    expect(await stability(page)).toBeGreaterThan(0);
    expect(await stability(page)).toBeLessThan(40);
  });

  test("abandoning shows a practice shift report", async ({ page }) => {
    await boot(page, "&anomaly=none");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /ABANDON SHIFT/ }).click();
    await expect(page.getByText("PRACTICE SHIFT")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("LOOPS WALKED")).toBeVisible();
  });
});
