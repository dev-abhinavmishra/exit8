import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.puddle — a slow sheen of standing water spreads across the
 * terrazzo mid-run, catching the troffer light. Moderate.
 */
export const corridorPuddle: AnomalyDef = {
  id: "corridor.puddle",
  displayName: "Standing Water",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["clock.head"],
  excludes: ["corridor.steam", "platform.water"],
  testSeed: "test.corridor.puddle",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const wet = new StandardMaterial("mat.corridor.wet", ctx.scene);
    wet.diffuseColor = new Color3(0.05, 0.06, 0.07);
    wet.specularColor = new Color3(0.55, 0.6, 0.65);
    wet.specularPower = 3;
    wet.alpha = 0.75;
    const p = CreateBox("anomaly.corridor.puddle", { width: 0.9, height: 0.008, depth: 1.6 }, ctx.scene);
    p.material = wet;
    p.parent = ctx.world.root;
    p.position.set(0.55, 0.012, 27.5);
    p.rotation.y = 0.3;
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        const k = Math.min(1, t / 40);
        p.scaling.x = p.scaling.z = 0.4 + k * 0.6;
      },
      cleanup() {
        p.dispose();
        wet.dispose();
      },
    };
  },
};
