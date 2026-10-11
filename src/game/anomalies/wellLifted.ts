import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * well.lifted — the cover isn't slid, it's been taken off entirely and
 * leaned against the west wall beside the well. The whole mouth of the
 * pit stands open: a black rectangle where the floor should be.
 */
export const wellLifted: AnomalyDef = {
  id: "well.lifted",
  displayName: "It's Been Lifted",
  chapter: 1,
  category: "spatial",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [10, 100],
  requires: ["well.cover"],
  excludes: ["well.ajar", "well.grip", "well.riser", "well.lit"],
  testSeed: "test.well.lifted",
  dangerous: false,
  activate(ctx) {
    const cover = ctx.scene.getTransformNodeByName("well.cover");
    if (!cover) return { update() {}, cleanup() {} };
    // well sits at (-0.85, 0, 31); wall face ≈ x -1.8. Lean the plate
    // against the tile just south of the well, bottom edge on the floor.
    cover.position = new Vector3(-0.72, 0.62, 0.55);
    cover.rotation.z = 1.22; // leaning on the west wall face
    cover.rotation.y = -0.1;
    return {
      update() {},
      cleanup() {
        cover.position = new Vector3(0, 0.052, 0);
        cover.rotation.z = 0;
        cover.rotation.y = 0;
      },
    };
  },
};
