import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.low — the hanging clock drops to eye height on its stem, face
 * dead center in the walkway. Unmistakable.
 */
export const clockLow: AnomalyDef = {
  id: "clock.low",
  displayName: "The Clock Hangs Low",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["clock.head"],
  excludes: ["clock.fallen", "clock.sway"],
  testSeed: "test.clock.low",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const head = world.registry.mesh("clock.head");
    head.position = new Vector3(0, 1.62, 30.0);
    return {
      update() {},
      cleanup() {
        head.position.set(0, 2.42, 30.0);
      },
    };
  },
};
