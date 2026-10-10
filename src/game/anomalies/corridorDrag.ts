import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.drag — a long drag-scar scores the floor from mid-corridor
 * to the platform gate sill, and the gate's lowest bar sits bent a few
 * degrees off plumb. Primary wrong + fixture tell. Ch II+, moderate.
 */
export const corridorDrag: AnomalyDef = {
  id: "corridor.drag",
  displayName: "Dragged To The Gate",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["platform.bar.2"],
  excludes: ["platform.bar"],
  testSeed: "test.corridor.drag",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const scar = new StandardMaterial("mat.drag.scar", ctx.scene);
    scar.diffuseColor = new Color3(0.09, 0.08, 0.07);
    scar.specularColor = new Color3(0.15, 0.14, 0.12);
    const gash = CreateBox("anomaly.drag.gash", { width: 0.05, height: 0.006, depth: 4.6 }, ctx.scene);
    gash.material = scar;
    gash.parent = ctx.world.root;
    gash.position.set(-0.85, 0.013, 37.6);
    gash.rotation.y = 0.38;
    const bar = ctx.world.registry.get("platform.bar.2");
    const rot0 = bar.rotation.clone();
    bar.rotation.z = 0.09;
    return {
      update() {},
      cleanup() {
        bar.rotation.copyFrom(rot0);
        gash.dispose();
        scar.dispose();
      },
    };
  },
};
