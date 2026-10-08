/**
 * floor.flood — one zone's floor is under still black water: a dark
 * mirrored sheet where terrazzo and guide strip should be. The
 * corridor's best-known betrayal. Unmistakable spatial-class anomaly.
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
  dangerous: false,
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
    return {
      update() {},
      cleanup() {
        plane.dispose();
        water.dispose();
      },
    };
  },
};
