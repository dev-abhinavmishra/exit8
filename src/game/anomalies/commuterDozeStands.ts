import type { AnomalyDef } from "./types";

/**
 * commuter.doze.stands — he is at the departure board like always…
 * except he is asleep ON HIS FEET, tipped just past upright, chin on
 * his chest. Nobody balances like that.
 */
export const commuterDozeStands: AnomalyDef = {
  id: "commuter.doze.stands",
  displayName: "Asleep On His Feet",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["commuter"],
  excludes: ["commuter.midboard", "commuter.gates"],
  testSeed: "test.commuter.doze.stands",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "board");
    commuter.setDozePoseLock(true);
    // same standing spot, impossible posture
    commuter.fig.headPivot.rotation.set(0.82, 0.05, 0.1);
    commuter.fig.arms[0]!.rotation.x = -0.3;
    commuter.fig.arms[1]!.rotation.x = -0.28;
    commuter.root.rotation.x = 0.05; // tipped just past balance
    return {
      update(_dt: number) {},
      cleanup() {
        commuter.setDozePoseLock(false);
        commuter.root.rotation.x = 0;
      },
    };
  },
};
