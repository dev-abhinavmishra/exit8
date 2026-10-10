import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * svc.panel.open — the access panel east z30.5 (below the clock) swings
 * wide; the cavity behind is black and two cable ends spill out.
 * Moderate.
 */
export const svcPanelOpen: AnomalyDef = {
  id: "svc.panel.open",
  displayName: "A Service Panel Hangs Open",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["svc.panel.2"],
  excludes: ["hatch.hand"],
  testSeed: "test.svc.panel.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const pn = world.registry.mesh("svc.panel.2");
    const face = pn.getChildMeshes(false).find((m) => m.name.endsWith(".face"));
    if (face) {
      face.setPivotPoint(new Vector3(0, 0, -0.26));
      face.rotation.y = -1.9;
    }
    const cavity = CreateBox("anomaly.svc.cavity", { width: 0.02, height: 0.66, depth: 0.5 }, scene);
    cavity.material = world.materials.rubber;
    cavity.parent = world.root;
    cavity.position.set(1.665, 1.35, 30.5);
    const wires: string[] = [];
    for (const [i, wy, wz] of [
      [0, 1.15, 30.42],
      [1, 1.05, 30.58],
    ] as const) {
      const w = CreateBox(`anomaly.svc.wire.${i}`, { width: 0.03, height: 0.4, depth: 0.03 }, scene);
      w.material = world.materials.rubber;
      w.parent = world.root;
      w.position.set(1.6, wy, wz);
      w.rotation.z = 0.5 + i * 0.35;
      wires.push(w.name);
    }
    return {
      update() {},
      cleanup() {
        if (face) {
          face.rotation.y = 0;
          face.setPivotPoint(Vector3.Zero());
        }
        cavity.dispose();
        for (const n of wires) scene.getMeshByName(n)?.dispose();
      },
    };
  },
};
