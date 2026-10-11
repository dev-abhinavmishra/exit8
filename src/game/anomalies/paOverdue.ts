import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * pa.overdue — no announcements all loop. The horns never key up: not
 * dead air, not phantom calls — the feed simply never comes. Subtle;
 * complements pa.deadair (a horn that keys up on nothing) by making the
 * absence itself the wrongness.
 */
export const paOverdue: AnomalyDef = {
  id: "pa.overdue",
  displayName: "No Announcements Tonight",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: ["pa.horn.12.2", "pa.horn.40.5"],
  excludes: ["pa.deadair", "announce.spatial"],
  testSeed: "test.pa.overdue",
  dangerous: false,
  ambientMute: ["pa"],
  activate(_ctx): AnomalyInstance {
    return {
      update(_dt: number) {},
      cleanup() {},
    };
  },
};
