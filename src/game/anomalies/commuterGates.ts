/**
 * commuter.gates — he stands at the fare gates facing the way out,
 * as if waiting to leave — but no train runs and the gates never
 * open. Wrong threshold, wrong expectation. Moderate.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterGates: AnomalyDef = {
  id: "commuter.gates",
  displayName: "Waiting at the Gates",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.upright", "commuter.stare", "commuter.midboard"],
  testSeed: "test.commuter.gates",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    const g = c.root;
    c.reset(true, "board"); // standing, paper folded under his arm
    g.position.set(0.3, 0, 51.2);
    g.rotation.set(0, 0, 0); // square to the gates
    return {
      update() {},
      cleanup() {
        c.reset(was);
      },
    };
  },
};
