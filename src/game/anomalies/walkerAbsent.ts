/**
 * walker.absent — the other inspector isn't here this loop. No figure,
 * no cadence: the corridor has a hole where the routine should be.
 * Subtle — you have to have learned he's always there.
 */
import type { AnomalyDef } from "./types";

export const walkerAbsent: AnomalyDef = {
  id: "walker.absent",
  displayName: "No One Else On Shift",
  chapter: 1,
  category: "character",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["ambient.walker"],
  excludes: ["figure"],
  testSeed: "test.walker.absent",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("absent");
    return {
      update() {
        // absence holds the whole loop
      },
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
