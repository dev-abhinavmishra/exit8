import type { AnomalyDef } from "./types";

/**
 * commuter.fled — the departure plays at sprint pace: gather snaps,
 * stride doubles, bag swinging. He is out of the corridor in seconds,
 * head down — a man leaving somewhere he does not want to be.
 */
export const commuterFled: AnomalyDef = {
  id: "commuter.fled",
  displayName: "He Hurries Out",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["commuter"],
  excludes: ["commuter.north", "commuter.midflee", "commuter.stays"],
  testSeed: "test.commuter.fled",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 8, speed: 2.6 });
    return {
      update(_dt: number) {
        // head stays down the whole way — the anomaly already reads
        // through the doubled stride; keep his chin off the route
        if (commuter.departState() === "walk") commuter.fig.headPivot.rotation.x = 0.4;
      },
      cleanup() {},
    };
  },
};
