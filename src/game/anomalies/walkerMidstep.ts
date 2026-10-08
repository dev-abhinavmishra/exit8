/**
 * walker.midstep — the other inspector is frozen mid-stride. Legs
 * split, arms mid-swing, facing his direction of travel — he reads as
 * walking at a glance, and wrong the moment you wait for a step that
 * never lands. Unlike walker.stare (stopped, squared up at you), he
 * never acknowledges you at all; he simply paused inside his own
 * motion.
 */
import type { AnomalyDef } from "./types";

export const walkerMidstep: AnomalyDef = {
  id: "walker.midstep",
  displayName: "Paused Mid-Step",
  chapter: 3,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["ambient.walker"],
  excludes: ["figure", "walker.stare", "walker.backwards", "walker.crawl", "walker.fast"],
  testSeed: "test.walker.midstep",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("midstep");
    return {
      update() {
        // the pose holds for the whole loop
      },
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
