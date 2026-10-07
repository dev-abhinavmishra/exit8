import { test, expect, type Page } from "@playwright/test";

const BASE = "/?e2e=1&engine=webgl";

async function ready(page: Page, extra = "") {
  await page.goto(`${BASE}&seed=e2e-boot${extra}`);
  await page.waitForFunction(
    () =>
      (window as unknown as { __nightaudit?: { ready?: boolean } }).__nightaudit
        ?.ready === true,
    null,
    { timeout: 60_000 },
  );
}

test.describe("boot", () => {
  test("boots to the start screen over a live scene", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await ready(page);
    await expect(page.getByRole("heading", { name: "NIGHT AUDIT" })).toBeVisible();
    await expect(page.getByRole("button", { name: /BEGIN SHIFT/ })).toBeVisible();
    const kind = await page.evaluate(() =>
      (window as unknown as { __nightaudit: { engine(): string } }).__nightaudit.engine(),
    );
    expect(["webgl2", "webgpu"]).toContain(kind);
    expect(errors).toEqual([]);
  });

  test("start begins the run and HUD appears", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
    await page.waitForFunction(
      () =>
        (window as unknown as { __nightaudit: { state(): string } }).__nightaudit.state() ===
        "playing",
    );
    await expect(page.locator(".na-hud.on")).toBeVisible();
    const loop = await page.evaluate(() =>
      (window as unknown as { __nightaudit: { loop(): number } }).__nightaudit.loop(),
    );
    expect(loop).toBe(1);
  });

  test("pointer-lock fallback: keys still move the player", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
    const z0 = await page.evaluate(
      () =>
        (window as unknown as { __nightaudit: { pos(): { z: number } } }).__nightaudit.pos()
          .z,
    );
    await page.evaluate(() =>
      (window as unknown as { __nightaudit: { key(c: string, d: boolean): void } }).__nightaudit.key(
        "KeyW",
        true,
      ),
    );
    await page.waitForFunction(
      (z) =>
        (window as unknown as { __nightaudit: { pos(): { z: number } } }).__nightaudit.pos()
          .z >
        z + 1.5,
      z0,
      { timeout: 15_000 },
    );
    await page.evaluate(() =>
      (window as unknown as { __nightaudit: { key(c: string, d: boolean): void } }).__nightaudit.key(
        "KeyW",
        false,
      ),
    );
  });

  test("pause and resume via Escape", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        (window as unknown as { __nightaudit: { state(): string } }).__nightaudit.state() ===
        "paused",
    );
    await expect(page.locator("text=HOLD ON LOOP 7")).toBeVisible();
    await page.getByRole("button", { name: "RESUME" }).click();
    await page.waitForFunction(
      () =>
        (window as unknown as { __nightaudit: { state(): string } }).__nightaudit.state() ===
        "playing",
    );
  });

  test("keyboard-only navigation reaches settings and back", async ({ page }) => {
    await ready(page);
    for (let i = 0; i < 12; i++) {
      const on = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.tagName === "BUTTON" && (el.innerText ?? "").includes("SETTINGS");
      });
      if (on) break;
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Enter");
    await expect(page.locator("text=FIELD KIT")).toBeVisible();
    await page.getByRole("button", { name: "BACK" }).click();
    await expect(page.getByRole("button", { name: /BEGIN SHIFT/ })).toBeVisible();
  });

  test("settings persist across reload", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: "SETTINGS" }).click();
    await page.locator(".seg button", { hasText: "low" }).first().click();
    await page.reload();
    await page.waitForFunction(
      () =>
        (window as unknown as { __nightaudit?: { ready?: boolean } }).__nightaudit
          ?.ready === true,
      null,
      { timeout: 60_000 },
    );
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem("nightaudit.save");
      return raw
        ? (JSON.parse(raw) as { settings: { video: { quality: string } } }).settings.video
            .quality
        : null;
    });
    expect(saved).toBe("low");
  });

  test("save blob is created with the v1 schema", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: "SETTINGS" }).click();
    await page.getByRole("button", { name: "BACK" }).click();
    const blob = await page.evaluate(() => {
      const raw = localStorage.getItem("nightaudit.save");
      return raw ? (JSON.parse(raw) as { version: number; flags: unknown }) : null;
    });
    expect(blob?.version).toBe(1);
  });
});
