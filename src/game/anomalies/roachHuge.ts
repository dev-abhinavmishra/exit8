import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * roach.huge — it is eight times the size it should be, glossy shell
 * spanning a floor tile. Unmistakable at any distance.
 */
export const roachHuge: AnomalyDef = {
  id: "roach.huge",
  displayName: "The Wrong Size",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["roach"],
  excludes: ["roach.swarm", "roach.dead", "roach.gone", "roach.flees"],
  testSeed: "test.roach.huge",
  dangerous: false,
  activate(ctx) {
    const r = ctx.world.registry.get("roach");
    r.scaling = new Vector3(8, 8, 8);
    r.position.y = 0.045; // keep the shell on the tile, not in it
    return {
      update() {},
      cleanup() {
        r.scaling = new Vector3(1, 1, 1);
        r.position.y = 0.006;
      },
    };
  },
};
