import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.drip — something dark leaks from the clock housing and pools
 * on the terrazzo directly beneath it. Unmistakable.
 */
export const clockDrip: AnomalyDef = {
  id: "clock.drip",
  displayName: "The Clock Is Bleeding",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [30, 100],
  requires: ["clock.head"],
  excludes: ["clock.gone"],
  testSeed: "test.clock.drip",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const blood = new StandardMaterial("mat.clock.drip", scene);
    blood.diffuseColor = new Color3(0.11, 0.015, 0.012);
    blood.specularColor = new Color3(0.3, 0.04, 0.03);
    const drip = CreateBox("anomaly.clock.drip", { width: 0.03, height: 1.9, depth: 0.03 }, scene);
    drip.material = blood;
    drip.parent = world.root;
    drip.position.set(0, 1.5, 30.06);
    const pool = CreateBox("anomaly.clock.pool", { width: 0.9, height: 0.012, depth: 0.9 }, scene);
    pool.material = blood;
    pool.parent = world.root;
    pool.position.set(0, 0.012, 30.06);
    pool.rotation.y = 0.7;
    return {
      update() {},
      cleanup() {
        drip.dispose();
        pool.dispose();
        blood.dispose();
      },
    };
  },
};
