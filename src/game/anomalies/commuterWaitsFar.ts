import type { AnomalyDef } from "./types";

/**
 * commuter.waits.far — the give-way reads you from four metres out:
 * he halts absurdly early, mid-corridor, and stands there watching
 * while you still have half the passage to cover before you reach him.
 */
export const commuterWaitsFar: AnomalyDef = {
  id: "commuter.waits.far",
  displayName: "He Stops Too Early",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [20, 80],
  requires: ["commuter", "al.south.cap"],
  excludes: [
    "commuter.stays",
    "commuter.returns",
    "commuter.north",
    "commuter.fled",
    "commuter.midflee",
    "commuter.steps.linger",
    "commuter.steps.ahead",
    "commuter.steps.off",
    "commuter.walks.through",
    "commuter.waits.forever",
    "commuter.brushes.past",
    "commuter.detour",
  ],
  testSeed: "test.commuter.waits.far",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 14 });
    // halt window stretched wide — he yields from halfway down the zone
    commuter.setGiveWay({ lane: 1.6, near: 1.8, far: 5.0 });
    return {
      update() {},
      cleanup() {
        commuter.setGiveWay(null);
      },
    };
  },
};
