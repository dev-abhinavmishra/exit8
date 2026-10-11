import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * drip.sync — every vent in the corridor plinks at once, on a slow
 * regular beat. Baseline drips are one vent at a time, irregular;
 * unison is unmistakably wrong once heard twice. The anomaly owns the
 * drip timer and schedules its own beats.
 */
export const dripSync: AnomalyDef = {
  id: "drip.sync",
  displayName: "The Vents Keep Time",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["vent.grille.0", "vent.grille.1", "vent.grille.2"],
  excludes: [],
  testSeed: "test.drip.sync",
  dangerous: false,
  ambientMute: ["drip"],
  activate(ctx): AnomalyInstance {
    const vents = ctx.world.anchors.vents;
    const period = 6.5;
    let t = 3; // first strike lands early enough to be heard on a short look
    let captioned = false;
    return {
      update(dt: number) {
        t += dt;
        if (t >= period) {
          t -= period;
          for (const v of vents) ctx.audio.playWaterPlink(v);
          if (!captioned) {
            captioned = true;
            ctx.audio.caption("every vent plinks at once — in time", null);
          }
        }
      },
      cleanup() {},
    };
  },
};
