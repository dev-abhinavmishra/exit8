/**
 * horn.crackle — one PA horn spits static: a burst-cluster of relay
 * spits with no carrier under them, two or three volleys across the
 * loop. Distinct from pa.deadair's single open line — this sounds like
 * a horn with a wet coil, not a keyed mic. Subtle because it is short
 * and easy to mistake for the duct noise.
 */
import type { AnomalyDef } from "./types";

export const hornCrackle: AnomalyDef = {
  id: "horn.crackle",
  displayName: "Horn Spits Static",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.75,
  progressionRange: [10, 100],
  requires: ["wall.left.0"],
  excludes: ["sound.announce", "pa.deadair", "announce.spatial", "machine.silence"],
  testSeed: "test.horn.crackle",
  dangerous: false,
  activate(ctx) {
    const horn = ctx.rng.pick(ctx.world.anchors.paHorns);
    let t = ctx.rng.range(5, 12);
    let volleys = 2 + Math.floor(ctx.rng.draw() * 2); // 2–3 volleys
    return {
      update(dt) {
        if (volleys <= 0) return;
        t -= dt;
        if (t <= 0) {
          volleys -= 1;
          ctx.audio.playCrackle(horn);
          t = ctx.rng.range(18, 35);
        }
      },
      cleanup() {},
    };
  },
};
