/**
 * commuter.gone.bag — he is not on the bench tonight, but unlike the
 * usual absence (paper left behind) tonight it is the SATCHEL that
 * stays: parked on the seat where he always leaves it. Subtle.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterGoneBag: AnomalyDef = {
  id: "commuter.gone.bag",
  displayName: "Gone, Bag Left Behind",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["commuter", "commuter.bag"],
  excludes: ["commuter.gone.paper", "commuter.bag.gone"],
  testSeed: "test.commuter.gone.bag",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    const bag = ctx.world.registry.mesh("commuter.bag");
    c.reset(false); // him and his things absent
    if (bag) {
      // but the bag stays — the wrong trace for an absence
      bag.setEnabled(true);
      bag.position.set(-1.3, 0.62, 33.05); // on the seat itself
      bag.rotation.y = 0.1;
    }
    return {
      update() {},
      cleanup() {
        c.reset(was);
      },
    };
  },
};
