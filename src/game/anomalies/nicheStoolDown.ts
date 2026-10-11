/**
 * niche.stool.down — the staff nook's stool lies tipped on its side,
 * and the boots beneath it are knocked askew — someone left in a hurry.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

export const nicheStoolDown: AnomalyDef = {
  id: "niche.stool.down",
  displayName: "Stool Tipped Over",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [8, 100],
  requires: ["niche.stool", "niche.boot.0", "niche.boot.1"],
  excludes: [],
  testSeed: "test.niche.stool.down",
  dangerous: false,
  activate(ctx) {
    const stool = ctx.world.registry.get("niche.stool") as TransformNode;
    const b0 = ctx.world.registry.get("niche.boot.0");
    const b1 = ctx.world.registry.get("niche.boot.1");
    const save = stool.rotation.clone();
    const saveY = stool.position.y;
    stool.rotation.z = Math.PI / 2 - 0.15; // on its side, against the wall
    stool.rotation.y = 0.3;
    stool.position.y = 0.16;
    if (b0) b0.rotation.z = -0.9;
    if (b1) b1.position.z += 0.16;
    return {
      update() {},
      cleanup() {
        stool.rotation.copyFrom(save);
        stool.position.y = saveY;
        if (b0) b0.rotation.z = 0;
        if (b1) b1.position.z -= 0.16;
      },
    };
  },
};
