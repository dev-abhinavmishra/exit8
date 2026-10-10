/**
 * supply.open — the grille is rolled all the way up into the facade,
 * the cage is lit, and a steel cart stands half out of the mouth with
 * parcels on it. The window does not open. Unmistakable object-class —
 * the impossible-room reveal for the supply cage.
 */
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Color3, Vector3 } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const supplyOpen: AnomalyDef = {
  id: "supply.open",
  displayName: "The Cage Is Open",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.55,
  progressionRange: [30, 100],
  requires: ["supply.grille", "supply.lamp"],
  // scene-space PointLight can't follow corridor.mirror's flip
  excludes: ["corridor.mirror", "supply.lit", "supply.ajar", "supply.bare"],
  testSeed: "test.supply.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const grille = world.registry.mesh("supply.grille");
    const lamp = world.registry.mesh("supply.lamp");
    const savedY = grille.position.y;
    grille.position.y = savedY + 1.32; // bars retract into the header
    const lampMat = lamp.material as StandardMaterial;
    const lampSaved = lampMat.emissiveColor.clone();
    lampMat.emissiveColor = new Color3(0.7, 0.45, 0.16);
    const glow = new PointLight("anomaly.supply.open.glow", new Vector3(2.7, 2.0, 35.0), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.4);
    glow.intensity = 0.75;
    glow.range = 4.2;
    // a cart half out of the mouth, parcels aboard
    const cart = CreateBox("anomaly.supply.cart", { width: 0.5, height: 0.08, depth: 0.8 }, scene);
    cart.material = world.materials.steel;
    cart.parent = world.root;
    cart.position.set(1.62, 0.78, 34.6);
    for (const [i, py, pz] of [
      [0, 0.9, 34.4],
      [1, 0.9, 34.78],
    ] as const) {
      const p = CreateBox(`anomaly.supply.cart.parcel.${i}`, { width: 0.3, height: 0.22, depth: 0.3 }, scene);
      p.material = world.materials.rubber;
      p.parent = world.root;
      p.position.set(1.62, py, pz);
    }
    return {
      update() {},
      cleanup() {
        grille.position.y = savedY;
        lampMat.emissiveColor = lampSaved;
        glow.dispose();
        cart.dispose();
        for (const n of ["anomaly.supply.cart.parcel.0", "anomaly.supply.cart.parcel.1"]) {
          scene.getMeshByName(n)?.dispose();
        }
      },
    };
  },
};
