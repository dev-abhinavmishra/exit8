/**
 * cab.gone — the fire point's red wall cabinet is simply not there.
 * The sign, extinguisher and bracket remain; only the red box is gone.
 * Subtle object-class anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const cabGone: AnomalyDef = {
  id: "cab.gone",
  displayName: "Missing Fire Cabinet",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["fireCabinet"],
  excludes: ["fire.open"],
  testSeed: "test.cab.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const cab = world.registry.get("fireCabinet");
    cab.setEnabled(false);
    return {
      update() {},
      cleanup() {
        cab.setEnabled(true);
      },
    };
  },
};
