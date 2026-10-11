import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * train.near — the working line sounds like it switched to the corridor
 * side of the wall: a pass every so often, but louder, brighter, with a
 * whistle that cuts instead of trailing. The anomaly owns the train
 * timer; its own schedule fires `playTrainPass(true)` — the near voicing.
 */
export const trainNear: AnomalyDef = {
  id: "train.near",
  displayName: "On the Wrong Side of the Wall",
  chapter: 3,
  category: "sound",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["platform.void", "platform.signal"],
  excludes: ["train.overdue", "train.surge", "platform.train"],
  testSeed: "test.train.near",
  dangerous: false,
  ambientMute: ["train"],
  activate(ctx): AnomalyInstance {
    const schedule = [18, 52, 96];
    let t = 0;
    let idx = 0;
    return {
      update(dt: number) {
        t += dt;
        if (idx < schedule.length && t >= schedule[idx]!) {
          ctx.audio.playTrainPass(true);
          idx += 1;
        }
      },
      cleanup() {},
    };
  },
};
