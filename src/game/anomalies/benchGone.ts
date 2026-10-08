/**
 * bench.gone — the mid-corridor bench is simply not there. The wall
 * run where it always sat is bare — no berth, no slats, nothing.
 * Moderate object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const benchGone: AnomalyDef = {
  id: "bench.gone",
  displayName: "Bench Missing",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["bench.south"],
  excludes: ["bench.moved", "bench.sit", "bench.slat"],
  testSeed: "test.bench.gone",
  dangerous: false,
  activate(ctx) {
    const bench = ctx.world.registry.get("bench.south");
    bench.setEnabled(false);
    return {
      update() {},
      cleanup() {
        bench.setEnabled(true);
      },
    };
  },
};
