/**
 * walker.backwards — the other inspector keeps his usual route and pace,
 * but he is facing away from where he is going. He moonwalks the loop.
 * Moderate: the cadence sounds normal, the silhouette is wrong.
 */
import type { AnomalyDef } from "./types";

export const walkerBackwards: AnomalyDef = {
  id: "walker.backwards",
  displayName: "He Walks Backward",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["ambient.walker"],
  excludes: ["figure"],
  testSeed: "test.walker.backwards",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("backwards");
    return {
      update() {
        // the walker animates himself from the sim step
      },
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
