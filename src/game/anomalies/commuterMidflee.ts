import type { AnomalyDef } from "./types";

/**
 * commuter.midflee — he leaves like any departure… and mid-stride,
 * partway to the door, he stops dead and turns to face you. Bag at his
 * side, paper under his arm, frozen mid-route. Unmistakable.
 */
export const commuterMidflee: AnomalyDef = {
  id: "commuter.midflee",
  displayName: "Stopped Mid-Stride",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [35, 100],
  requires: ["commuter"],
  excludes: ["commuter.north", "commuter.fled", "commuter.stays"],
  testSeed: "test.commuter.midflee",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 10 });
    let held = false;
    return {
      update(_dt: number) {
        if (held || commuter.departState() !== "walk") return;
        const p = commuter.root.position;
        if (p.z > 42) {
          held = true;
          commuter.setDepartHold(true);
          const pp = ctx.player.position;
          commuter.root.rotation.y = Math.atan2(pp.x - p.x, pp.z - p.z);
          ctx.audio.caption("he stopped mid-stride — facing you", null);
        }
      },
      cleanup() {
        commuter.setDepartHold(false);
      },
    };
  },
};
