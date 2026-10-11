/**
 * announce.spatial — a PA announcement from above the gallery where no
 * horn exists. The corridor's PA voice comes out of the junction horns;
 * this one keys up over open tile, close overhead, on a slow seeded
 * cadence. Subtle because the speaker that isn't there only gives
 * itself away if you already know the horn layout.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const announceSpatial: AnomalyDef = {
  id: "announce.spatial",
  displayName: "Phantom PA",
  chapter: 3,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: ["wall.left.0"],
  excludes: ["sound.announce", "pa.deadair", "horn.crackle", "phone.rings", "machine.silence"],
  testSeed: "test.announce.spatial",
  dangerous: false,
  activate(ctx) {
    // above the gallery troffers — the nearest horn is at the junction
    const pos = new Vector3(0.6, 3.0, 23 + ctx.rng.range(-2, 2));
    let t = ctx.rng.range(6, 14);
    let cadence = ctx.rng.range(30, 60);
    return {
      update(dt) {
        t -= dt;
        if (t <= 0) {
          ctx.audio.playAnnouncement(pos);
          cadence = ctx.rng.range(30, 60);
          t = cadence;
        }
      },
      cleanup() {},
    };
  },
};
