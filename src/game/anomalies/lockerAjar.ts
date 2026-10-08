/**
 * locker.ajar — one locker door hangs open on its hinge, dark interior
 * showing. Every door on the route was shut. Moderate object-class
 * anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const lockerAjar: AnomalyDef = {
  id: "locker.ajar",
  displayName: "Open Locker",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [0, 100],
  requires: ["lockers.door2.pivot"],
  excludes: [],
  testSeed: "test.locker.ajar",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const pivot = world.registry.get("lockers.door2.pivot");
    const rot = pivot.rotation.clone();
    pivot.rotation.y = 0.85; // swings the leaf toward the corridor
    return {
      update() {},
      cleanup() {
        pivot.rotation.copyFrom(rot);
      },
    };
  },
};
