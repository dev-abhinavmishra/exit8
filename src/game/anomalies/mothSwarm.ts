import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * moth.swarm — the lamp face isn't carrying one moth tonight: eight of
 * them rest scattered across the louver and the ceiling edge beside
 * it. A crowd of small silhouettes where a single one lives.
 * Unmistakable at the fixture.
 */
const SPOTS: readonly [number, number, number, number][] = [
  // [x, y, z, heading] — spread over the lamp face + the ceiling seam
  [-0.83, 2.935, 24.32, 0.4],
  [-0.97, 2.935, 24.38, -0.7],
  [-0.88, 2.935, 24.62, 2.2],
  [-0.93, 2.935, 24.71, 1.1],
  [-0.79, 2.935, 24.48, -2.0],
  [-1.0, 2.935, 24.55, 0.9],
  [-0.72, 2.965, 24.4, 2.8], // ceiling seam beside the frame
  [-1.06, 2.965, 24.62, -1.4],
];

export const mothSwarm: AnomalyDef = {
  id: "moth.swarm",
  displayName: "Every One Of Them",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["moth"],
  excludes: ["moth.gone", "moth.dead", "moth.huge"],
  testSeed: "test.moth.swarm",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const skin = new StandardMaterial("mat.moth.swarm", scene);
    skin.diffuseColor = new Color3(0.15, 0.12, 0.09);
    skin.specularColor = new Color3(0.02, 0.02, 0.02);
    const parts: string[] = [];
    SPOTS.forEach(([x, y, z, heading], i) => {
      const body = CreateBox(
        `anomaly.moth.swarm.${i}.body`,
        { width: 0.012, height: 0.007, depth: 0.026 },
        scene,
      );
      body.material = skin;
      body.parent = world.root;
      body.position = new Vector3(x, y, z);
      body.rotation.y = heading;
      parts.push(body.name);
      for (const [side, rz] of [
        [-1, -0.16],
        [1, 0.16],
      ] as const) {
        const wing = CreateBox(
          `anomaly.moth.swarm.${i}.w.${side < 0 ? "l" : "r"}`,
          { width: 0.024, height: 0.003, depth: 0.02 },
          scene,
        );
        wing.material = skin;
        wing.parent = world.root;
        wing.position = new Vector3(
          x + Math.cos(heading) * side * 0.014,
          y + 0.002,
          z - Math.sin(heading) * side * 0.014,
        );
        wing.rotation.y = heading;
        wing.rotation.z = rz;
        parts.push(wing.name);
      }
    });
    return {
      update() {},
      cleanup() {
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        skin.dispose();
      },
    };
  },
};
