/**
 * commuter.bag.gone — he reads his paper as always, but the satchel
 * that always parks at his feet is not there. Subtle.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterBagGone: AnomalyDef = {
  id: "commuter.bag.gone",
  displayName: "Bag Missing",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [10, 100],
  requires: ["commuter.bag", "commuter"],
  excludes: ["commuter.gone.paper"],
  testSeed: "test.commuter.bag.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const bag = ctx.world.registry.get("commuter.bag");
    if (!bag) return { update() {}, cleanup() {} };
    bag.setEnabled(false);
    return {
      update() {},
      cleanup() {
        bag.setEnabled(true);
      },
    };
  },
};
