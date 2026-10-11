import type { AnomalyDef } from "./types";

/**
 * commuter.waits.forever — the give-way fires and never releases:
 * halt for him once and he is still standing there an hour later,
 * chin lifted, watching the spot you won't move from.
 */
export const commuterWaitsForever: AnomalyDef = {
  id: "commuter.waits.forever",
  displayName: "He Waits For You",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [25, 90],
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
    "commuter.brushes.past",
    "commuter.waits.far",
    "commuter.detour",
  ],
  testSeed: "test.commuter.waits.forever",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 12 });
    commuter.setGiveWay({ hold: true });
    let said = false;
    return {
      update() {
        if (!said && commuter.giveWayBlocked()) {
          said = true;
          ctx.audio.caption("he stops, and he does not start again", commuter.root.position);
        }
      },
      cleanup() {
        commuter.setGiveWay(null);
      },
    };
  },
};
