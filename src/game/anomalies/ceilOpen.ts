import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * ceil.open — the panel is off entirely and two cable stubs hang out
 * of the plenum mouth, sheared short. The opening gapes black
 * overhead. Unmistakable.
 */
export const ceilOpen: AnomalyDef = {
  id: "ceil.open",
  displayName: "Open To The Plenum",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["ceil.panel", "ceil.void"],
  excludes: ["ceil.ajar", "ceil.fallen", "ceil.lit"],
  testSeed: "test.ceil.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const panel = scene.getTransformNodeByName("ceil.panel");
    if (!panel) return { update() {}, cleanup() {} };
    // panel rests on the rim's north edge, one end dropped into the frame
    panel.position = new Vector3(0.1, -0.05, -0.52);
    panel.rotation.z = 0.9;
    const stubMat = new StandardMaterial("mat.ceil.stub", scene);
    stubMat.diffuseColor = new Color3(0.05, 0.05, 0.055);
    const parts: string[] = [];
    for (const [cx, len] of [
      [0.12, 0.3],
      [-0.08, 0.22],
    ] as const) {
      const stub = CreateBox(
        `anomaly.ceil.stub.${cx > 0 ? "a" : "b"}`,
        { width: 0.016, height: len, depth: 0.016 },
        scene,
      );
      stub.material = stubMat;
      stub.parent = world.root;
      stub.position = new Vector3(0.35 + cx, 3.0 - len / 2 - 0.02, 28.15);
      stub.rotation.x = cx > 0 ? 0.08 : -0.06;
      parts.push(stub.name);
    }
    return {
      update() {},
      cleanup() {
        panel.position = new Vector3(0, -0.018, 0);
        panel.rotation.z = 0;
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        stubMat.dispose();
      },
    };
  },
};
