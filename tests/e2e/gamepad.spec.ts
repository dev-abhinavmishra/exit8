import { test, expect, type Page } from "@playwright/test";

const NA = "window.__nightaudit";

async function bootWithPad(page: Page) {
  await page.addInitScript(() => {
    const pad = {
      id: "e2e-pad",
      index: 0,
      connected: true,
      mapping: "standard",
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      timestamp: 0,
    };
    (window as unknown as { __pad: typeof pad }).__pad = pad;
    navigator.getGamepads = () => [pad as unknown as Gamepad, null, null, null];
  });
  await page.goto(`/?e2e=1&engine=webgl&seed=e2e-pad&anomaly=none`);
  await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, {
    timeout: 60_000,
  });
  await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
  await page.waitForFunction(`${NA}.state() === "playing"`);
}

test.describe("gamepad", () => {
  test("left stick moves the player", async ({ page }) => {
    await bootWithPad(page);
    const z0 = (await page.evaluate(`${NA}.pos()`)) as { z: number };
    await page.evaluate(`__pad.axes[1] = -1`);
    await page.waitForTimeout(1500);
    await page.evaluate(`__pad.axes[1] = 0`);
    const z1 = (await page.evaluate(`${NA}.pos()`)) as { z: number };
    expect(z1.z - z0.z).toBeGreaterThan(0.8);
  });

  test("right stick turns the view", async ({ page }) => {
    await bootWithPad(page);
    const y0 = (await page.evaluate(`${NA}.view()`)) as { yaw: number };
    await page.evaluate(`__pad.axes[2] = 1`);
    await page.waitForTimeout(800);
    await page.evaluate(`__pad.axes[2] = 0`);
    const y1 = (await page.evaluate(`${NA}.view()`)) as { yaw: number };
    expect(Math.abs(y1.yaw - y0.yaw)).toBeGreaterThan(0.2);
  });

  test("start button toggles pause", async ({ page }) => {
    await bootWithPad(page);
    await page.evaluate(`__pad.buttons[9].pressed = true`);
    await page.waitForFunction(`${NA}.state() === "paused"`, null, { timeout: 10_000 });
    await page.evaluate(`__pad.buttons[9].pressed = false`);
    await page.waitForTimeout(300); // let the edge detector see the release
    await page.evaluate(`__pad.buttons[9].pressed = true`);
    await page.waitForFunction(`${NA}.state() === "playing"`, null, { timeout: 10_000 });
  });
});
