/**
 * pilaster.scar — deep gouges run down the east column at z≈43.5,
 * flanked by debris at its plinth. Something raked the concrete.
 * Moderate object-class.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const pilasterScar: AnomalyDef = {
  id: "pilaster.scar",
  displayName: "The Column Is Raked",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["col.e.2"],
  excludes: [],
  testSeed: "test.pilaster.scar",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const mat = new StandardMaterial("mat.pilaster.gouge", scene);
    mat.diffuseColor = new Color3(0.06, 0.05, 0.045);
    mat.specularColor = Color3.Black();
    const parts: string[] = [];
    // three gouges down the corridor-facing surface, slight rake
    for (const [i, gz, gy, gh] of [
      [0, 43.38, 1.9, 0.9],
      [1, 43.5, 1.6, 1.2],
      [2, 43.62, 1.75, 0.8],
    ] as const) {
      const g = CreateBox(`anomaly.pilaster.gouge.${i}`, { width: 0.012, height: gh, depth: 0.09 }, scene);
      g.material = mat;
      g.parent = world.root;
      g.position.set(1.492, gy, gz);
      g.rotation.x = 0.12 * (i - 1);
      parts.push(g.name);
    }
    const rubble = CreateBox("anomaly.pilaster.rubble", { width: 0.3, height: 0.05, depth: 0.4 }, scene);
    rubble.material = world.materials.concrete;
    rubble.parent = world.root;
    rubble.position.set(1.42, 0.026, 43.5);
    parts.push(rubble.name);
    return {
      update() {},
      cleanup() {
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        mat.dispose();
      },
    };
  },
};
