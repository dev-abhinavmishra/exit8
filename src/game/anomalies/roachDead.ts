import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * roach.dead — belly-up on the tile, legs curled toward the ceiling.
 * It isn't ambling anymore; it's what ambling things become.
 */
export const roachDead: AnomalyDef = {
  id: "roach.dead",
  displayName: "On Its Back",
  chapter: 1,
  category: "character",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [5, 100],
  requires: ["roach"],
  excludes: ["roach.swarm", "roach.gone", "roach.flees", "roach.huge"],
  testSeed: "test.roach.dead",
  dangerous: false,
  activate(ctx) {
    const r = ctx.world.registry.get("roach");
    r.rotation.x = Math.PI; // flipped shell-down
    r.position = new Vector3(-1.45, 0.017, 35.6);
    return {
      update() {},
      cleanup() {
        r.rotation.x = 0;
        r.position = new Vector3(-1.52, 0.006, 36.0);
      },
    };
  },
};
