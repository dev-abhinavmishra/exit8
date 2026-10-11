import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * commuter.stays — on a loop that schedules his departure, he never
 * leaves: the read goes on past his stop. Subtle — mirrors
 * commuter.ignores for the greet habit. Pure suppression.
 */
export const commuterStays: AnomalyDef = {
  id: "commuter.stays",
  displayName: "He Missed His Stop",
  chapter: 1,
  category: "character",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [0, 45],
  requires: ["commuter"],
  excludes: [],
  testSeed: "test.commuter.stays",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.commuter.setDepart(null);
    return {
      update(_dt: number) {},
      cleanup() {},
    };
  },
};
