/**
 * commuter.midboard — when he is up checking times, he stands four
 * and a half metres SOUTH of the board, tipped back reading the
 * ceiling where no board hangs. Moderate.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterMidboard: AnomalyDef = {
  id: "commuter.midboard",
  displayName: "Reading Where No Board Hangs",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.upright", "commuter.stare", "commuter.gates"],
  testSeed: "test.commuter.midboard",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    const g = c.root;
    // force his board-read pose, then slide him away from under it
    c.reset(true, "board");
    g.position.set(0.35, 0, 43.2);
    return {
      update() {},
      cleanup() {
        c.reset(was);
      },
    };
  },
};
