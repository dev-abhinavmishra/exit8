import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.spin — the minute hands race. Both faces spin at a readably
 * wrong speed. Unmistakable.
 */
export const clockSpin: AnomalyDef = {
  id: "clock.spin",
  displayName: "The Hands Are Racing",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["clock.head"],
  excludes: ["clock.wrong", "clock.fallen"],
  testSeed: "test.clock.spin",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const head = world.registry.mesh("clock.head");
    const hands: AbstractMesh[] = [];
    head.getChildMeshes(false).forEach((m) => {
      if (m.name.endsWith(".m")) hands.push(m);
    });
    return {
      update(_dt: number) {
        for (const h of hands) h.rotation.z -= _dt * 2.2;
      },
      cleanup() {},
    };
  },
};
