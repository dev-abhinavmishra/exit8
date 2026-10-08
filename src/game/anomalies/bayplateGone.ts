/**
 * bayplate.gone — one of the six steel bay plates on the records
 * bank is simply not there. The slip frame, the label, everything —
 * a bare stretch of cabinet face where the count should say six.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const bayplateGone: AnomalyDef = {
  id: "bayplate.gone",
  displayName: "Missing Bay Plate",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: [
    "bay.plate.15.5",
    "bay.plate.18.5",
    "bay.plate.21.5",
    "bay.plate.24.5",
    "bay.plate.27.5",
    "bay.plate.30.5",
  ],
  excludes: ["cabinet"],
  testSeed: "test.bayplate.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const z = rng.pick([15.5, 18.5, 21.5, 24.5, 27.5, 30.5]);
    const plate = world.registry.mesh(`bay.plate.${z}`);
    const slip = scene.getMeshByName(`bay.plate.${z}.slip`);
    plate.setEnabled(false);
    slip?.setEnabled(false);
    return {
      update() {},
      cleanup() {
        plate.setEnabled(true);
        slip?.setEnabled(true);
      },
    };
  },
};
