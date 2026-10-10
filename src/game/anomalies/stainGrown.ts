import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * stain.grown — the grime streak under the east vent z37 has swollen
 * into a metre-long black drip that reaches the floor. Moderate.
 */
export const stainGrown: AnomalyDef = {
  id: "stain.grown",
  displayName: "The Stain Has Grown",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["svc.vent.0"],
  excludes: ["vent.breath"],
  testSeed: "test.stain.grown",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const dark = new StandardMaterial("mat.stain.grown", scene);
    dark.diffuseColor = new Color3(0.045, 0.04, 0.035);
    dark.specularColor = new Color3(0.15, 0.12, 0.1);
    const streak = CreateBox("anomaly.stain.big", { width: 0.014, height: 0.95, depth: 0.24 }, scene);
    streak.material = dark;
    streak.parent = world.root;
    streak.position.set(1.695, 0.52, 37.2);
    const toe = CreateBox("anomaly.stain.toe", { width: 0.5, height: 0.01, depth: 0.3 }, scene);
    toe.material = dark;
    toe.parent = world.root;
    toe.position.set(1.6, 0.012, 37.2);
    return {
      update() {},
      cleanup() {
        streak.dispose();
        toe.dispose();
        dark.dispose();
      },
    };
  },
};
