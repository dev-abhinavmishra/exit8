import { test, expect, type Page } from "@playwright/test";

const NA = "window.__nightaudit";
const NOTE_IDS = ["note.clock", "note.vent", "note.counter", "note.shadow", "note.air", "note.machine"];

async function boot(page: Page, params: string) {
  await page.goto(`/?e2e=1&engine=webgl&seed=e2e-evidence${params}`);
  await page.waitForFunction(`${NA} && ${NA}.ready === true`, null, {
    // engine boot under full-suite CPU contention can approach a minute
    timeout: 90_000,
  });
  await page.getByRole("button", { name: /BEGIN SHIFT/ }).click();
  await page.waitForFunction(`${NA}.state() === "playing"`);
}

test.setTimeout(150_000);

test.describe("field notes", () => {
  test("a spawned note files itself on interact and persists", async ({ page }) => {
    await boot(page, "");
    const spawned = (await page.evaluate(
      `${JSON.stringify(NOTE_IDS)}.map(id => ${NA}.meshInfo('evidence.' + id)).filter(Boolean)`,
    )) as { pos: [number, number, number] }[];
    // EVIDENCE_PER_RUN caps at 3; any seed must spawn at least one while unfilled
    expect(spawned.length).toBeGreaterThanOrEqual(1);
    expect(spawned.length).toBeLessThanOrEqual(3);

    // stand ~1.1m off the note's face, aim at its center
    const [nx, ny, nz] = spawned[0]!.pos;
    const flat = ny < 1.2; // counter/bench notes lie face-up — stand off diagonally
    const sx = flat ? nx + 0.9 : nx + (nx < 0 ? 1.1 : -1.1);
    const sz = flat ? nz + 1.0 : nz;
    const yaw = Math.atan2(nx - sx, nz - sz);
    const pitch = Math.atan2(1.62 - ny, Math.hypot(nx - sx, nz - sz));
    await page.evaluate(`${NA}.teleport(${sx}, 1.62, ${sz}, ${yaw})`);
    await page.evaluate(`${NA}.look(${yaw}, ${pitch})`);
    await page.waitForTimeout(600);

    await expect(page.locator(".na-hud .use-prompt")).toContainText("FIELD NOTE");
    await page.evaluate(`${NA}.key('KeyE', true)`);
    await page.evaluate(`${NA}.key('KeyE', false)`);
    await page.waitForTimeout(500);

    const after = await page.evaluate(
      `${JSON.stringify(NOTE_IDS)}.map(id => { const m = ${NA}.meshInfo('evidence.' + id); return m ? m.enabled : null; })`,
    );
    expect(after).toContain(false);
    const discoveries = (await page.evaluate(
      `JSON.parse(localStorage.getItem('nightaudit.save')).progression.discoveries`,
    )) as string[];
    expect(discoveries.length).toBe(1);
    await expect(page.locator(".na-captions")).toContainText("FIELD NOTE FILED");
  });

  test("a full dossier upgrades the secured ending", async ({ page }) => {
    await page.addInitScript((ids) => {
      window.localStorage.setItem(
        "nightaudit.save",
        JSON.stringify({
          version: 1,
          progression: {
            bestStability: 0,
            runsCompleted: 0,
            routesSecured: 0,
            anomaliesLogged: 0,
            falseClears: 0,
            falseAlarms: 0,
            discovered: [],
            discoveries: ids,
            endings: [],
            dailies: [],
          },
        }),
      );
    }, NOTE_IDS);
    await boot(page, "&anomaly=clock.reverse");
    // one correct retreat at 95 secures the route — and the dossier renames the ending
    await page.evaluate(`${NA}.setStability(95)`);
    await page.evaluate(`${NA}.teleport(0, 0, -2.95, ${Math.PI})`);
    // drive the interactive walk-out: the cap drops ~2.9s of sim after
    // judgment, then stepping through the doorway ends the route. Under
    // SwiftShader sim time runs far slower than wall-clock, so waiting
    // on the 14s no-walk fallback can take ~80s — walking is both the
    // real path and the fast one. Timeout still covers the fallback.
    await page.waitForFunction(`${NA}.meshInfo('al.north.cap').pos[1] < 1`, null, {
      timeout: 90_000,
    });
    await page.keyboard.down("w");
    await page.waitForFunction(`${NA}.state() === "results"`, null, { timeout: 90_000 });
    await page.keyboard.up("w");
    await expect(page.locator(".na-stamp")).toContainText("DOSSIER COMPLETE");
    const endings = (await page.evaluate(
      `JSON.parse(localStorage.getItem('nightaudit.save')).progression.endings`,
    )) as string[];
    expect(endings).toContain("investigative");
  });
});
