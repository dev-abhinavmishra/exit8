/**
 * bench.moved — the mid-corridor bench (the one without a shadow berth)
 * has been dragged nearly a metre into the walkway. Moderate: it now eats
 * the travel lane on the left.
 */
import type { AnomalyDef } from "./types";

export const benchMoved: AnomalyDef = {
  id: "bench.moved",
  displayName: "Dragged Bench",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["bench.south"],
  excludes: [],
  testSeed: "test.bench.moved",
  dangerous: false,
  activate(ctx) {
    const bench = ctx.world.registry.get("bench.south");
    const orig = bench.position.clone();
    bench.position.x = orig.x + ctx.rng.range(0.7, 1.0);
    bench.position.z = orig.z + ctx.rng.range(-0.2, 0.2);
    return {
      update() {},
      cleanup() {
        bench.position.copyFrom(orig);
      },
    };
  },
};
