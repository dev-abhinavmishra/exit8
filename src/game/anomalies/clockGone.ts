import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.gone — the clock head is missing; the hanger stem dangles empty
 * and a pale ceiling scar remains. Moderate.
 */
export const clockGone: AnomalyDef = {
  id: "clock.gone",
  displayName: "The Clock Is Gone",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["clock.head"],
  excludes: ["clock.fallen", "clock.drip"],
  testSeed: "test.clock.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const head = world.registry.mesh("clock.head");
    head.getChildMeshes(false).forEach((m) => {
      if (m.name === "clock.stem") return;
      m.setEnabled(false);
    });
    const scar = CreateBox("anomaly.clock.scar", { width: 0.4, height: 0.02, depth: 0.4 }, scene);
    scar.material = world.materials.domePad;
    scar.parent = world.root;
    scar.position.set(0, 3.14, 30.0);
    return {
      update() {},
      cleanup() {
        head.getChildMeshes(false).forEach((m) => m.setEnabled(true));
        scar.dispose();
      },
    };
  },
};
