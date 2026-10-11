import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * moth.huge — the moth is the wrong size. It still rests on the lamp
 * face in the same shallow-V pose, but the wings span most of the
 * louver — a hand-sized silhouette where a thumbnail lives.
 * Unmistakable.
 */
export const mothHuge: AnomalyDef = {
  id: "moth.huge",
  displayName: "The Wrong Size",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["moth"],
  excludes: ["moth.gone", "moth.dead", "moth.swarm", "moth.orbit"],
  testSeed: "test.moth.huge",
  dangerous: false,
  activate(ctx) {
    const moth = ctx.scene.getTransformNodeByName("moth");
    if (!moth) return { update() {}, cleanup() {} };
    moth.scaling = new Vector3(6, 6, 6);
    // scaling widens the V slightly — drop it a touch so the wings
    // still read resting on the face rather than floating off it
    moth.position.y = 2.93;
    return {
      update() {},
      cleanup() {
        moth.scaling = new Vector3(1, 1, 1);
        moth.position.y = 2.935;
      },
    };
  },
};
