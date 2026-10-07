/**
 * bin.wanders — the service bin by the south end has shifted off the wall.
 * Moderate: it sits a stride into the walkway and a metre north of its
 * memorized berth.
 */
import type { AnomalyDef } from "./types";

export const binWanders: AnomalyDef = {
  id: "bin.wanders",
  displayName: "Bin Out of Place",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["bin"],
  excludes: [],
  testSeed: "test.bin.wanders",
  dangerous: false,
  activate(ctx) {
    const bin = ctx.world.registry.mesh("bin");
    const orig = bin.position.clone();
    bin.position.x = orig.x - ctx.rng.range(0.5, 0.9);
    bin.position.z = orig.z - ctx.rng.range(0.8, 1.8);
    return {
      update() {},
      cleanup() {
        bin.position.copyFrom(orig);
      },
    };
  },
};
