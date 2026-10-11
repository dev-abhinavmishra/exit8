/**
 * walker.greets — tonight the inspector returns the courtesy: as he
 * crosses the bench his head turns toward the commuter for a slow
 * ~1.1s. Baseline he never acknowledges the man. Subtle.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const walkerGreets: AnomalyDef = {
  id: "walker.greets",
  displayName: "He Returns the Nod",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 1,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.ignores"],
  testSeed: "test.walker.greets",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.ambientWalker.setGreetAt(33.3);
    return {
      update() {},
      cleanup() {
        ctx.world.ambientWalker.setGreetAt(null);
      },
    };
  },
};
