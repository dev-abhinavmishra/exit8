import type { AnomalyDef } from "./types";

/**
 * stalls.shut — every stall door is closed. On the whole corridor
 * tonight, this is the room where nothing opens. Moderate: the room
 * reads "occupied" without anything you can point at.
 */
export const stallsShut: AnomalyDef = {
  id: "stalls.shut",
  displayName: "Both Stalls Shut",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["wash.stall.door.0", "wash.stall.door.1"],
  excludes: ["stall.occupied", "stall.feet"],
  testSeed: "test.stalls.shut",
  dangerous: false,
  activate(ctx) {
    const d0 = ctx.world.registry.get("wash.stall.door.0");
    const d1 = ctx.world.registry.get("wash.stall.door.1");
    const b0 = d0.rotation.y;
    const b1 = d1.rotation.y;
    d0.rotation.y = 0;
    d1.rotation.y = 0;
    return {
      update() {},
      cleanup() {
        d0.rotation.y = b0;
        d1.rotation.y = b1;
      },
    };
  },
};
