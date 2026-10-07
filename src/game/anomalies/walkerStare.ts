/**
 * walker.stare — the other inspector has stopped mid-corridor. He stands
 * squared up toward your approach, dead still, and does not move for the
 * whole loop. Unmistakable once you're close; subtle from the doorway —
 * he reads as just another shape until he never moves.
 */
import type { AnomalyDef } from "./types";

export const walkerStare: AnomalyDef = {
  id: "walker.stare",
  displayName: "He Is Waiting",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["ambient.walker"],
  excludes: ["figure"],
  testSeed: "test.walker.stare",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("stare");
    return {
      update() {
        // he holds the pose the whole loop
      },
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
