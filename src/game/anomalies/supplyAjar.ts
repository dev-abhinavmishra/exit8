/**
 * supply.ajar — the cage grille rides up a hand's width and a parcel
 * sits on the corridor floor where the counter ledge ends. Someone
 * served a crate tonight. Moderate object-class, second tell included.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const supplyAjar: AnomalyDef = {
  id: "supply.ajar",
  displayName: "The Cage Is Ajar",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["supply.grille"],
  excludes: ["supply.open"],
  testSeed: "test.supply.ajar",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const grille = world.registry.mesh("supply.grille");
    const savedY = grille.position.y;
    grille.position.y = savedY + 0.38;
    // a parcel left on the floor where the ledge ends — the second tell
    const parcel = CreateBox("anomaly.supply.parcel", { width: 0.34, height: 0.28, depth: 0.42 }, scene);
    parcel.material = world.materials.rubber;
    parcel.parent = world.root;
    parcel.position.set(1.3, 0.14, 34.1);
    parcel.rotation.y = -0.3;
    return {
      update() {},
      cleanup() {
        grille.position.y = savedY;
        parcel.dispose();
      },
    };
  },
};
