import type { AnomalyDef } from "./types";

/**
 * commuter.north — he gathers like any departure, but walks the wrong
 * way: north, to the sealed end of the corridor, and stands there
 * facing the door that never opens. He is still standing there when
 * you leave.
 */
export const commuterNorth: AnomalyDef = {
  id: "commuter.north",
  displayName: "The Wrong Way Out",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["commuter"],
  excludes: ["commuter.stays", "commuter.fled", "commuter.midflee"],
  testSeed: "test.commuter.north",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 12, north: true });
    let captioned = false;
    return {
      update(_dt: number) {
        if (!captioned && commuter.departState() === "wait") {
          captioned = true;
          ctx.audio.caption("he waits at the sealed end — it never opens", null);
        }
      },
      cleanup() {},
    };
  },
};
