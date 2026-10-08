/**
 * lockers.all — not one locker but all four stand open on their
 * hinges, dark interiors showing down the whole run. Moderate
 * object-class anomaly.
 */
import type { AnomalyDef } from "./types";

const PIVOTS = ["lockers.door0.pivot", "lockers.door1.pivot", "lockers.door2.pivot", "lockers.door3.pivot"];

export const lockersAll: AnomalyDef = {
  id: "lockers.all",
  displayName: "Every Locker Open",
  chapter: 3,
  category: "object",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [30, 100],
  requires: ["lockers.door0.pivot", "lockers.door1.pivot", "lockers.door2.pivot", "lockers.door3.pivot"],
  excludes: ["locker.ajar"],
  testSeed: "test.lockers.all",
  dangerous: false,
  activate(ctx) {
    const restores: { n: { rotation: { y: number } }; y: number }[] = [];
    for (const name of PIVOTS) {
      const n = ctx.world.registry.get(name);
      restores.push({ n, y: n.rotation.y });
      n.rotation.y = ctx.rng.range(0.45, 0.95);
    }
    return {
      update() {},
      cleanup() {
        for (const r of restores) r.n.rotation.y = r.y;
      },
    };
  },
};
