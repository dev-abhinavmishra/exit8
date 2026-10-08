/**
 * pa.deadair — one of the PA horns keys up on dead air: relay click,
 * the open-line carrier hiss held a beat, click off. No announcement
 * follows. The corridor's PA is a voice; a voice that opens its mouth
 * and says nothing is wrong. Audio-only, easy to miss if you are not
 * listening — moderate because the hiss is unmistakable once heard.
 */
import type { AnomalyDef } from "./types";

export const paDeadAir: AnomalyDef = {
  id: "pa.deadair",
  displayName: "Dead Air",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["wall.left.0"],
  excludes: ["sound.announce", "announce.spatial", "phone.rings", "machine.silence"],
  testSeed: "test.pa.deadair",
  dangerous: false,
  activate(ctx) {
    const horn = ctx.rng.pick(ctx.world.anchors.paHorns);
    let t = ctx.rng.range(7, 16); // lands while you're mid-corridor
    return {
      update(dt) {
        if (t < 0) return;
        t -= dt;
        if (t <= 0) {
          t = -1;
          ctx.audio.playPaDeadAir(horn);
        }
      },
      cleanup() {},
    };
  },
};
