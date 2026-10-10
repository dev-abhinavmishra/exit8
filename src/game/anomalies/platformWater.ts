import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * platform.water — black water sheens the recess floor and creeps a
 * drip line under the sill, onto the corridor's own wall. Moderate.
 */
export const platformWater: AnomalyDef = {
  id: "platform.water",
  displayName: "Water In The Gap",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["platform.sill"],
  excludes: [],
  testSeed: "test.platform.water",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const wet = new StandardMaterial("mat.platform.wet", scene);
    wet.diffuseColor = new Color3(0.03, 0.04, 0.05);
    wet.specularColor = new Color3(0.4, 0.45, 0.5);
    wet.specularPower = 4;
    const pool = CreateBox("anomaly.platform.pool", { width: 0.05, height: 0.006, depth: 1.05 }, scene);
    pool.material = wet;
    pool.parent = world.root;
    pool.position.set(-1.95, 0.012, 39.7);
    const run = CreateBox("anomaly.platform.run", { width: 0.02, height: 0.7, depth: 0.04 }, scene);
    run.material = wet;
    run.parent = world.root;
    run.position.set(-1.99, 0.4, 39.85);
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        run.scaling.y = 0.6 + Math.min(1, t / 30) * 0.7;
        run.position.y = (0.4 * (2 - run.scaling.y)) / 1.05;
      },
      cleanup() {
        pool.dispose();
        run.dispose();
        wet.dispose();
      },
    };
  },
};
