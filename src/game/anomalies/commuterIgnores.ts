/**
 * commuter.ignores — the inspector crosses the bench and the commuter
 * never lifts his chin: the learned greeting simply does not happen.
 * Subtle — an absence of a habit, not a person.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterIgnores: AnomalyDef = {
  id: "commuter.ignores",
  displayName: "No Passing Greeting",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 1,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.follows", "commuter.offers"],
  testSeed: "test.commuter.ignores",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    c.setGreetEnabled(false);
    return {
      update() {},
      cleanup() {
        c.setGreetEnabled(true);
      },
    };
  },
};
