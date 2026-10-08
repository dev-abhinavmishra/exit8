/**
 * slat.missing — one of the bench's five seat slats vanishes. The bench is
 * built countable on purpose; subtle players count, everyone else walks.
 */
import type { AnomalyDef } from "./types";

export const slatMissing: AnomalyDef = {
  id: "slat.missing",
  displayName: "Missing Bench Slat",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["bench.slat.2", "bench.south.slat.0"],
  excludes: ["prop.bench"],
  testSeed: "test.slat.missing",
  dangerous: false,
  activate(ctx) {
    // either bench, any of the five slats — seeded per loop
    const bench = ctx.rng.pick(["bench", "bench.south"]);
    const slat = ctx.world.registry.mesh(`${bench}.slat.${ctx.rng.int(0, 5)}`);
    slat.isVisible = false;
    return {
      update() {},
      cleanup() {
        slat.isVisible = true;
      },
    };
  },
};
