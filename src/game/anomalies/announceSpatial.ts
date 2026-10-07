/**
 * announce.spatial — a PA chime sounds from a point high in the gallery
 * where there is no speaker. Repeats on a seeded 30–60 s cadence. Subtle.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const SPOT = new Vector3(1.4, 2.9, 26); // above the gallery glass — no speaker there

export const announceSpatial: AnomalyDef = {
  id: "announce.spatial",
  displayName: "Phantom PA",
  chapter: 1,
  category: "sound",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["sound.announce"],
  testSeed: "test.announce.spatial",
  dangerous: false,
  activate(ctx) {
    let next = ctx.rng.range(6, 14); // first chime lands soon so it's felt
    return {
      update(dt) {
        next -= dt;
        if (next <= 0) {
          ctx.audio.playChime(SPOT);
          next = ctx.rng.range(30, 60);
        }
      },
      cleanup() {},
    };
  },
};
