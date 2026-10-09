import { test, expect, type Page } from "@playwright/test";
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
    const id = m?.[1];
    return id ? [id] : [];
  });

// Catches the silent-skip class: a `requires` entry that names a node the
// registry never registered makes loopManager drop the anomaly (console
// warning only) — the route runs clean and the divergence never fires.
// Ids are split across N concurrent pages so the sweep stays a few
// minutes as the catalog grows; each page still boots a fresh context
// per def (about:blank teardown), which keeps GL context pile-up away.
test("every catalog anomaly activates when forced", async ({ page, context }) => {
  test.setTimeout(30 * 60_000);
  const LANES = 4;
  const failed: string[] = [];
  const runOne = async (pg: typeof page, id: string) => {
    let reason = "";
    const onConsole = (m: { text(): string }) => {
      const t = m.text();
      if (t.includes("missing registry node")) reason = t;
    };
    pg.on("console", onConsole);
    // one retry absorbs SwiftShader boot stalls under 4-lane contention
    for (let attempt = 0; attempt < 2; attempt++) {
      reason = "";
      try {
        // about:blank tears down the previous boot's engine — navigations
        // on one page otherwise pile up GL contexts and late boots crawl.
        await pg.goto("about:blank");
        await pg.goto(`/?e2e=1&seed=sweep&anomaly=${id}`, { waitUntil: "domcontentloaded" });
        await pg.waitForFunction(`${NA} && ${NA}.ready === true`, null, { timeout: 150_000 });
        await pg.getByRole("button", { name: /BEGIN SHIFT/ }).click();
        await pg.waitForFunction(`${NA}.loop() === 1`, null, { timeout: 30_000 });
        const active = await pg.evaluate(`${NA}.anomaly()`);
        if (active !== id) reason ||= `active=${JSON.stringify(active)}`;
      } catch (e) {
        reason ||= String(e).split("\n")[0] ?? "error";
      }
      if (!reason) break;
    }
    pg.off("console", onConsole);
    if (reason) failed.push(`${id}: ${reason}`);
  };
  const lanes: Page[] = [
    page,
    ...(await Promise.all(Array.from({ length: LANES - 1 }, () => context.newPage()))),
  ];
  try {
    await Promise.all(
      lanes.map(async (pg, lane) => {
        for (const id of IDS.filter((_, i) => i % LANES === lane)) {
          await runOne(pg, id);
        }
      }),
    );
  } finally {
    await Promise.all(lanes.slice(1).map((pg) => pg.close()));
  }
  expect(failed).toEqual([]);
});
