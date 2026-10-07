import { test, expect, type Page } from "@playwright/test";

const NA = "window.__nightaudit";

async function boot(page: Page) {
  await page.goto(`/?e2e=1&engine=webgl&seed=e2e-archive`);
  await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, {
    timeout: 60_000,
  });
}

test.describe("route archive", () => {
  test("opens from the start screen and lists unfiled divergences", async ({ page }) => {
    await boot(page);
    await page.getByRole("button", { name: /ROUTE ARCHIVE/ }).click();
    // count grows with the catalog — assert the shape, not a literal
    await expect(page.getByText(/DIVERGENCE REGISTER — 0 OF \d+ FILED/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("RUNS FILED")).toBeVisible();
    await expect(page.getByText("—— UNFILED ——").first()).toBeVisible();
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(page.getByRole("button", { name: /BEGIN SHIFT/ })).toBeVisible();
  });

  test("filed divergences render by display name", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "nightaudit.save",
        JSON.stringify({
          version: 1,
          progression: {
            discovered: ["clock.reverse", "light.out"],
            runsCompleted: 3,
            routesSecured: 1,
            bestStability: 88,
            anomaliesLogged: 5,
          },
        }),
      );
    });
    await boot(page);
    await page.getByRole("button", { name: /ROUTE ARCHIVE/ }).click();
    await expect(page.getByText("Counterclockwise Clock")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("ROUTES SECURED")).toBeVisible();
  });
});
