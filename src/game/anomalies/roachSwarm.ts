import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

const SPOTS: readonly (readonly [number, number, number])[] = [
  [-1.55, 0.006, 34.8],
  [-1.49, 0.006, 35.2],
  [-1.58, 0.006, 35.6],
  [-1.44, 0.006, 36.4],
  [-1.61, 0.006, 36.9],
  [-1.5, 0.006, 37.3],
  [-1.6, 0.006, 37.8],
  [-1.47, 0.006, 38.2],
  [-1.56, 0.006, 38.7],
  [-1.42, 0.006, 35.9],
  [-1.63, 0.006, 34.4],
  [-1.52, 0.006, 39.1],
];

/**
 * roach.swarm — it was never one. A dozen siblings hold the wall
 * base along four metres of corridor, all angled the same way.
 */
export const roachSwarm: AnomalyDef = {
  id: "roach.swarm",
  displayName: "It Was Never One",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["roach"],
  excludes: ["roach.gone", "roach.dead", "roach.huge", "roach.flees"],
  testSeed: "test.roach.swarm",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const m = new StandardMaterial("mat.roach.swarm", scene);
    m.diffuseColor = new Color3(0.1, 0.06, 0.03);
    m.specularColor = new Color3(0.45, 0.35, 0.25);
    const parts: string[] = [];
    SPOTS.forEach(([x, y, z], i) => {
      const b = CreateBox(`anomaly.roach.sib.${i}`, { width: 0.035, height: 0.011, depth: 0.05 }, scene);
      b.material = m;
      b.parent = world.root;
      b.position = new Vector3(x, y, z);
      b.rotation.y = -0.4 + Math.sin(i * 1.7) * 0.15;
      parts.push(b.name);
    });
    return {
      update() {},
      cleanup() {
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        m.dispose();
      },
    };
  },
};
