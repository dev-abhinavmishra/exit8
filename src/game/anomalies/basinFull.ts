import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * basin.full — one basin is filled to its rim. Water sits flush with
 * the porcelain edge, dead still and a shade too dark for tap water.
 * Subtle-moderate: it reads as a dark disc from the doorway.
 */
export const basinFull: AnomalyDef = {
  id: "basin.full",
  displayName: "Filled To The Rim",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["wash.vanity"],
  excludes: ["tap.runs"],
  testSeed: "test.basin.full",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const basin = scene.getMeshByName("wash.basin.1");
    if (!basin) return { update() {}, cleanup() {} };
    const p = basin.absolutePosition;
    const waterMat = new StandardMaterial("mat.basin.water", scene);
    waterMat.diffuseColor = new Color3(0.04, 0.05, 0.06);
    waterMat.specularColor = new Color3(0.35, 0.4, 0.42); // wet sheen
    const water = CreateBox("anomaly.basin.water", { width: 0.26, height: 0.012, depth: 0.4 }, scene);
    water.material = waterMat;
    water.parent = world.root;
    water.position = new Vector3(p.x, p.y + 0.021, p.z); // flush at the rim
    return {
      update() {},
      cleanup() {
        scene.getMeshByName("anomaly.basin.water")?.dispose();
        waterMat.dispose();
      },
    };
  },
};
