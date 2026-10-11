import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * well.riser — the cover is dragged aside and the well's rung ladder
 * has been raised: its top rungs now poke above the rim line, leaning
 * to the west rail, as if left half-drawn out of the pit. Something
 * climbed most of the way up. Unmistakable — the ladder lives below
 * the floor; above the rim it should not exist.
 */
export const wellRiser: AnomalyDef = {
  id: "well.riser",
  displayName: "The Ladder Is Up",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["well.cover", "well.ladder"],
  excludes: ["well.ajar", "well.lifted", "well.grip", "well.lit"],
  testSeed: "test.well.riser",
  dangerous: false,
  activate(ctx) {
    const cover = ctx.scene.getTransformNodeByName("well.cover");
    const ladder = ctx.scene.getTransformNodeByName("well.ladder");
    if (!cover || !ladder) return { update() {}, cleanup() {} };
    cover.position.z = -0.55;
    // raised and shifted into the open south half of the mouth — the
    // rungs stand a head above the rim where no ladder should reach
    ladder.position = new Vector3(-0.24, 0.52, 0.42);
    return {
      update() {},
      cleanup() {
        cover.position.z = 0;
        ladder.position = new Vector3(-0.28, -0.16, 0);
      },
    };
  },
};
