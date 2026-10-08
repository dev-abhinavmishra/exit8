/**
 * horn.crackle — one of the PA horns wakes up wrong. Every few dozen
 * seconds it spits a single static pop into the corridor — no chime,
 * no voice, just the line clicking live and dying again. Subtle
 * sound-class anomaly; you have to place it to catch it.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const hornCrackle: AnomalyDef = {
  id: "horn.crackle",
  displayName: "Horn Spits Static",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.65,
  progressionRange: [20, 100],
  requires: [],
  excludes: ["announce.spatial", "machine.silence"],
  testSeed: "test.horn.crackle",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const horns = ctx.world.anchors.paHorns;
    if (!horns || horns.length === 0) return { update() {}, cleanup() {} };
    const horn = ctx.rng.pick(horns);
    let next = ctx.rng.range(9, 20);
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (t >= next) {
          next = t + ctx.rng.range(14, 34);
          ctx.audio.playPop(horn);
        }
      },
      cleanup() {},
    };
  },
};
