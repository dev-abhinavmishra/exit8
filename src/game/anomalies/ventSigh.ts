/**
 * vent.sigh — one of the high wall grilles exhales, once: a low airy
 * swell that rises and dies over a couple of seconds, pitch sagging
 * as the breath runs out. The ductwork breathes — the corridor never
 * does. Audio-only; you have to be listening.
 */
import type { AnomalyDef } from "./types";

export const ventSigh: AnomalyDef = {
  id: "vent.sigh",
  displayName: "The Vent Breathes",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [10, 100],
  requires: ["wall.left.0"],
  excludes: ["sound.announce", "announce.spatial", "vent.groan", "machine.silence", "pa.deadair"],
  testSeed: "test.vent.sigh",
  dangerous: false,
  activate(ctx) {
    const vent = ctx.rng.pick(ctx.world.anchors.vents);
    let t = ctx.rng.range(5, 12);
    return {
      update(dt) {
        if (t < 0) return;
        t -= dt;
        if (t <= 0) {
          t = -1;
          ctx.audio.playSigh(vent);
        }
      },
      cleanup() {},
    };
  },
};
