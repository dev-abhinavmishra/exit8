import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * moth.dead — the moth isn't at its lamp tonight; it's on the floor
 * under it, wings folded flat. Subtle: the absence up top plus a small
 * dark shape on the terrazzo below.
 */
export const mothDead: AnomalyDef = {
  id: "moth.dead",
  displayName: "On The Floor",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["moth"],
  excludes: ["moth.gone", "moth.swarm", "moth.orbit", "moth.huge"],
  testSeed: "test.moth.dead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const moth = scene.getTransformNodeByName("moth");
    if (!moth) return { update() {}, cleanup() {} };
    moth.setEnabled(false);
    const skin = new StandardMaterial("mat.moth.dead", scene);
    skin.diffuseColor = new Color3(0.15, 0.12, 0.09);
    skin.specularColor = new Color3(0.02, 0.02, 0.02);
    const parts: string[] = [];
    const body = CreateBox("anomaly.moth.dead.body", { width: 0.012, height: 0.006, depth: 0.026 }, scene);
    body.material = skin;
    body.parent = world.root;
    body.position = new Vector3(-0.78, 0.012, 25.3); // below the lamp, near the west lane edge
    body.rotation.y = 1.2;
    parts.push(body.name);
    // wings folded flat against the body — a small dark streak
    for (const [side] of [[-1], [1]] as const) {
      const wing = CreateBox(
        `anomaly.moth.dead.w.${side < 0 ? "l" : "r"}`,
        { width: 0.022, height: 0.002, depth: 0.018 },
        scene,
      );
      wing.material = skin;
      wing.parent = world.root;
      wing.position = new Vector3(-0.78 + side * 0.012, 0.01, 25.3);
      wing.rotation.y = 1.2;
      parts.push(wing.name);
    }
    return {
      update() {},
      cleanup() {
        moth.setEnabled(true);
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        skin.dispose();
      },
    };
  },
};
