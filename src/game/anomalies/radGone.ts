/**
 * rad.gone — the panel radiator on the east wall, the one you pass
 * in the first quarter of the route every loop, is simply not
 * there. Bare wall where it always stood. Subtle object-class
 * anomaly.
 */
import type { AnomalyDef } from "./types";

export const radGone: AnomalyDef = {
  id: "rad.gone",
  displayName: "Missing Radiator",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["rad.unit"],
  excludes: ["rad.leaks"],
  testSeed: "test.rad.gone",
  dangerous: false,
  activate(ctx) {
    const node = ctx.world.registry.get("rad.unit");
    node.setEnabled(false);
    return {
      update() {},
      cleanup() {
        node.setEnabled(true);
      },
    };
  },
};
