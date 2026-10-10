import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.fallen — the clock head lies on the corridor floor, face-up and
 * tilted, still ticking. The stem dangles empty overhead. Unmistakable.
 */
export const clockFallen: AnomalyDef = {
  id: "clock.fallen",
  displayName: "The Clock Is Down",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["clock.head"],
  excludes: ["clock.gone", "clock.wrong", "clock.spin"],
  testSeed: "test.clock.fallen",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const head = world.registry.mesh("clock.head");
    head.position = new Vector3(0.55, 0.1, 30.35);
    head.rotation.x = Math.PI / 2 - 0.18;
    head.rotation.z = 0.3;
    return {
      update() {},
      cleanup() {
        head.position.set(0, 2.42, 30.0);
        head.rotation.set(0, 0, 0);
      },
    };
  },
};
