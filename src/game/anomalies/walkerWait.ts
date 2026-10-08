/**
 * walker.wait — the inspector is not on his route. He stands at the
 * south airlock mouth, squared up the corridor, waiting on the
 * threshold you have to pass. Unmistakable character-class anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const walkerWait: AnomalyDef = {
  id: "walker.wait",
  displayName: "The Inspector Waits At The Door",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker",
    "walker.absent",
    "walker.stare",
    "walker.backwards",
    "walker.crawl",
    "walker.faceless",
    "walker.crowd",
    "walker.fast",
    "walker.charge",
    "figure.south",
  ],
  testSeed: "test.walker.wait",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // hold is what walker.stare does — just at the south mouth
    ctx.world.ambientWalker.holdAt(52.5);
    return {
      update() {},
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
