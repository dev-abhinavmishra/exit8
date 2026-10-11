import type { AnomalyDef } from "./types";

/**
 * commuter.detour — the give-way has become a detour: stand in his
 * lane and he doesn't stop — he swings out to the far lane, wide
 * around you, and never once breaks stride or looks your way.
 */
export const commuterDetour: AnomalyDef = {
  id: "commuter.detour",
  displayName: "The Long Way Round",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [25, 85],
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
    "commuter.waits.far",
  ],
  testSeed: "test.commuter.detour",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 14 });
    commuter.setGiveWay({ detour: true });
    return {
      update() {},
      cleanup() {
        commuter.setGiveWay(null);
      },
    };
  },
};
