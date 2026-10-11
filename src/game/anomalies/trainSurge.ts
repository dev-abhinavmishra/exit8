import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * train.surge — express hour on the working line: five passes inside
 * ~40s where the baseline would space them two minutes apart. The
 * anomaly owns the train timer so baseline passes can't pad the count.
 */
export const trainSurge: AnomalyDef = {
  id: "train.surge",
  displayName: "Train After Train",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["platform.void", "platform.signal"],
  excludes: ["train.overdue", "train.near", "platform.train"],
  testSeed: "test.train.surge",
  dangerous: false,
  ambientMute: ["train"],
  activate(ctx): AnomalyInstance {
    const schedule = [6, 14, 23, 33, 44];
    let t = 0;
    let idx = 0;
    let captioned = false;
    return {
      update(dt: number) {
        t += dt;
        if (idx < schedule.length && t >= schedule[idx]!) {
          ctx.audio.playTrainPass();
          idx += 1;
          if (!captioned && idx >= 2) {
            captioned = true;
            ctx.audio.caption("train after train — none of them stop", null);
          }
        }
      },
      cleanup() {},
    };
  },
};
