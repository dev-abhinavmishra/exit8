import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * train.overdue — the working line beyond the walls never runs tonight.
 * The baseline rumble cadence (every ~90-150s) goes silent for the whole
 * loop. Subtle — you notice the quiet before you can name it.
 */
export const trainOverdue: AnomalyDef = {
  id: "train.overdue",
  displayName: "The Line Never Runs",
  chapter: 1,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [0, 45],
  requires: ["platform.void", "platform.signal"],
  excludes: ["train.surge", "train.near", "platform.train"],
  testSeed: "test.train.overdue",
  dangerous: false,
  ambientMute: ["train"],
  activate(_ctx): AnomalyInstance {
    return {
      update(_dt: number) {
        // nothing to do — the silence is the whole anomaly
      },
      cleanup() {},
    };
  },
};
