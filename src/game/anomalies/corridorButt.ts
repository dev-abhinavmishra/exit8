import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.butt — a still-burning cigarette on the floor by the supply
 * cage, ember lit, a hair of smoke rising. Someone was just here. Moderate.
 */
export const corridorButt: AnomalyDef = {
  id: "corridor.butt",
  displayName: "Still Burning",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["supply.grille"],
  excludes: [],
  testSeed: "test.corridor.butt",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const paper = new StandardMaterial("mat.corridor.cig", scene);
    paper.diffuseColor = new Color3(0.85, 0.82, 0.75);
    const emberMat = new StandardMaterial("mat.corridor.ember", scene);
    emberMat.diffuseColor = Color3.Black();
    emberMat.emissiveColor = new Color3(1.0, 0.35, 0.05);
    const cig = CreateCylinder(
      "anomaly.corridor.cig",
      { height: 0.09, diameter: 0.012, tessellation: 8 },
      scene,
    );
    cig.material = paper;
    cig.parent = world.root;
    cig.rotation.z = Math.PI / 2 - 0.15;
    cig.rotation.y = 0.7;
    cig.position.set(-1.0, 0.02, 34.8);
    const ember = CreateBox("anomaly.corridor.ember", { width: 0.014, height: 0.014, depth: 0.014 }, scene);
    ember.material = emberMat;
    ember.parent = world.root;
    ember.position.set(-0.965, 0.025, 34.84);
    const smoke = new StandardMaterial("mat.corridor.cigsmoke", scene);
    smoke.diffuseColor = new Color3(0.7, 0.72, 0.75);
    smoke.specularColor = Color3.Black();
    smoke.alpha = 0.14;
    const wisp = CreateBox("anomaly.corridor.cigsmoke", { width: 0.02, height: 0.55, depth: 0.02 }, scene);
    wisp.material = smoke;
    wisp.parent = world.root;
    wisp.position.set(-0.965, 0.35, 34.84);
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        emberMat.emissiveColor.r = 0.8 + Math.sin(t * 2.4) * 0.2;
        wisp.position.y = 0.35 + Math.sin(t * 0.8) * 0.06;
        wisp.rotation.y = t * 0.5;
        wisp.scaling.x = wisp.scaling.z = 1 + Math.sin(t * 1.4) * 0.4;
      },
      cleanup() {
        cig.dispose();
        ember.dispose();
        wisp.dispose();
        paper.dispose();
        emberMat.dispose();
        smoke.dispose();
      },
    };
  },
};
