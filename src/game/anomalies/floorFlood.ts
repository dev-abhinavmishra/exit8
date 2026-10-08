/**
 * floor.flood — one zone's floor is under still black water: a dark
 * mirrored sheet where terrazzo and guide strip should be. The
 * corridor's best-known betrayal — and it punishes lingering: every
 * stride in it sounds wet, and standing in it too long docks the run.
 * File the flood; don't stand in it. Dangerous spatial-class anomaly.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef } from "./types";

const ZONES: [string, number, number][] = [
  ["entry", 0, 14],
  ["gallery", 14, 32],
  ["clinic", 32, 46],
];

export const floorFlood: AnomalyDef = {
  id: "floor.flood",
  displayName: "Flooded Floor",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["floor"],
  excludes: [
    "tracks.wet",
    "arrows.gone",
    "guide.missing",
    "guide.short",
    "guide.cross",
    "guide.misaligned",
    "guide.red",
    "strip.grows",
    "floor",
  ],
  testSeed: "test.floor.flood",
  dangerous: true,
  activate(ctx) {
    const { scene, rng } = ctx;
    const [, z0, z1] = rng.pick(ZONES);
    // still black water — nearly black diffuse, tight specular, faint
    // translucency so the terrazzo ghosts through at grazing angles
    const water = new StandardMaterial("anomaly.floorFlood.mat", scene);
    water.diffuseColor = new Color3(0.02, 0.025, 0.03);
    water.specularColor = new Color3(0.85, 0.85, 0.85);
    water.specularPower = 24;
    water.alpha = 0.94;
    const plane = CreatePlane("anomaly.floorFlood", { width: 3.56, height: z1 - z0 }, scene);
    plane.material = water;
    plane.rotation.x = -Math.PI / 2;
    plane.position = new Vector3(0, 0.035, (z0 + z1) / 2);
    let waded = false;
    let soakT = 0;
    let plinkT = 0;
    return {
      update(dt) {
        const p = ctx.player.position;
        const inWater = p.z > z0 && p.z < z1 && Math.abs(p.x) < 1.7;
        if (!inWater) return;
        // wading is often forced — the water spans the corridor — but
        // standing in it is a choice: soak for ~2s and the route feels it
        soakT += dt;
        if (!waded && soakT > 2.0) {
          waded = true;
          ctx.penalize?.(4);
          ctx.player.jolt(0.35);
          ctx.audio.playGroan(p.clone(), "a groan rolls under the water");
          ctx.audio.caption("the water is freezing — the route felt it", p.clone());
        }
        plinkT -= dt;
        if (plinkT <= 0) {
          plinkT = 0.42; // every stride sounds wet while you wade
          ctx.audio.playWaterPlink(p.clone());
        }
      },
      cleanup() {
        plane.dispose();
        water.dispose();
      },
    };
  },
};
