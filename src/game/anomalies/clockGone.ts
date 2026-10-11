import { MeshBuilder, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { TransformNode } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.gone — the hanging clock is simply gone. The stem still drops
 * from the ceiling and ends in a bare bolt plate where the housing
 * hung. Nobody heard it come down. Moderate.
 */
export const clockGone: AnomalyDef = {
  id: "clock.gone",
  displayName: "The Clock Is Gone",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [15, 100],
  requires: ["clock.head"],
  excludes: ["clock.fallen", "clock.low", "clock.sway", "clock.dark", "clock.drip"],
  testSeed: "test.clock.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world, scene } = ctx;
    const head = world.registry.mesh("clock.head") as TransformNode;
    const hidden = head.getChildMeshes(false).filter((m) => m.name !== "clock.stem");
    for (const m of hidden) m.setEnabled(false);

    const plate = MeshBuilder.CreateDisc("clock.gone.plate", { radius: 0.05, tessellation: 16 }, scene);
    const mat = new StandardMaterial("clock.gone.plate.mat", scene);
    mat.diffuseColor.set(0.16, 0.16, 0.17);
    mat.specularColor.scale(0.1);
    plate.material = mat;
    plate.parent = head;
    plate.position = new Vector3(0, 0.36, 0);
    plate.rotation.x = Math.PI / 2;

    return {
      update() {},
      cleanup() {
        for (const m of hidden) m.setEnabled(true);
        plate.dispose();
        mat.dispose();
      },
    };
  },
};
