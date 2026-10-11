import type { AnomalyDef } from "./types";

/**
 * well.ajar — the well cover has been dragged half off its seat. The
 * bolted plate that should sit flush in the rim now leaves the north
 * half of the mouth open to the dark. Subtle-moderate: a displaced
 * plate where one should sit flush.
 */
export const wellAjar: AnomalyDef = {
  id: "well.ajar",
  displayName: "The Cover Is Slid",
  chapter: 1,
  category: "spatial",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [5, 100],
  requires: ["well.cover"],
  excludes: ["well.lifted", "well.grip", "well.riser", "well.lit"],
  testSeed: "test.well.ajar",
  dangerous: false,
  activate(ctx) {
    const cover = ctx.scene.getTransformNodeByName("well.cover");
    if (!cover) return { update() {}, cleanup() {} };
    cover.position.z = -0.5; // dragged north, mouth open to the south
    return {
      update() {},
      cleanup() {
        cover.position.z = 0;
      },
    };
  },
};
