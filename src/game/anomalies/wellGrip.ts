import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * well.grip — the cover is dragged off-centre and four pale fingers
 * are curled over the south rim of the open mouth. Something down in
 * the well is holding the edge. It does not move. Unmistakable.
 */
export const wellGrip: AnomalyDef = {
  id: "well.grip",
  displayName: "A Hand On The Rim",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["well.cover", "well"],
  excludes: ["well.ajar", "well.lifted", "well.riser", "well.lit"],
  testSeed: "test.well.grip",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const cover = scene.getTransformNodeByName("well.cover");
    if (!cover) return { update() {}, cleanup() {} };
    cover.position.z = -0.44; // dragged north — south mouth open

    const skin = new StandardMaterial("mat.well.hand", scene);
    skin.diffuseColor = new Color3(0.72, 0.64, 0.56);
    skin.specularColor = new Color3(0.1, 0.09, 0.08);
    const parts: string[] = [];
    // the palm, inside the mouth just under the rim line
    const palm = CreateCapsule("anomaly.well.palm", { radius: 0.042, height: 0.13, tessellation: 10 }, scene);
    palm.material = skin;
    palm.parent = world.root;
    // well at (-0.85, 0, 31): south rim bar centre ≈ world z 31.70
    palm.position.set(-0.85, 0.028, 31.56);
    palm.rotation.x = Math.PI / 2 - 0.25; // wrist down into the dark
    parts.push(palm.name);
    // four fingers curled over the south rim bar, tips over the edge
    for (let f = 0; f < 4; f++) {
      const fin = CreateCapsule(
        `anomaly.well.finger.${f}`,
        { radius: 0.013, height: 0.08, tessellation: 8 },
        scene,
      );
      fin.material = skin;
      fin.parent = world.root;
      fin.position.set(-0.94 + f * 0.055, 0.052, 31.74);
      fin.rotation.x = Math.PI / 2 + 0.35; // lying over the bar, tips south
      parts.push(fin.name);
    }
    return {
      update() {},
      cleanup() {
        cover.position.z = 0;
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        skin.dispose();
      },
    };
  },
};
