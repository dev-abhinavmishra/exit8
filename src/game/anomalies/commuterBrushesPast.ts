import type { AnomalyDef } from "./types";

/**
 * commuter.brushes.past — the give-way window has shrunk to nothing:
 * stand in his lane and he doesn't halt — he threads past within
 * inches, close enough that his bag should touch your sleeve.
 */
export const commuterBrushesPast: AnomalyDef = {
  id: "commuter.brushes.past",
  displayName: "He Brushes Past",
  chapter: 1,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 75],
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
    "commuter.waits.far",
    "commuter.detour",
  ],
  testSeed: "test.commuter.brushes.past",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 14 });
    // a hand's-width window: he only "notices" you if you're nearly
    // touching his line — everything else he squeezes by
    commuter.setGiveWay({ lane: 0.22, near: 0.05, far: 0.5 });
    return {
      update() {},
      cleanup() {
        commuter.setGiveWay(null);
      },
    };
  },
};
