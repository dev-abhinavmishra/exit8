/**
 * pilaster.gone — the east column at z≈33 is missing entirely; the wall
 * field runs unbroken and a pale floor scar marks where its plinth
 * stood. Moderate object-class, second tell included.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const pilasterGone: AnomalyDef = {
  id: "pilaster.gone",
  displayName: "A Column Is Missing",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["col.e.1"],
  excludes: ["pilaster.extra"],
  testSeed: "test.pilaster.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const col = world.registry.mesh("col.e.1");
    col.setEnabled(false);
    // plinth scar — a pale patch on the terrazzo where it stood
    const scar = CreateBox("anomaly.pilaster.scar", { width: 0.34, height: 0.008, depth: 0.64 }, scene);
    scar.material = world.materials.domePad;
    scar.parent = world.root;
    scar.position.set(1.65, 0.012, 33.0);
    return {
      update() {},
      cleanup() {
        col.setEnabled(true);
        scar.dispose();
      },
    };
  },
};
