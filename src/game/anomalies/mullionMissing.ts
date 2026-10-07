/**
 * mullion.missing — one upright in the glass run is gone. Twelve metres
 * of unsupported glazing where a steel rib always stood.
 */
import type { AnomalyDef } from "./types";

export const mullionMissing: AnomalyDef = {
  id: "mullion.missing",
  displayName: "Missing Mullion",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery"],
  testSeed: "test.mullion.missing",
  dangerous: false,
  activate(ctx) {
    const { scene, rng } = ctx;
    const mz = rng.pick([20, 23, 26, 29, 32]);
    const m = scene.getMeshByName(`wall.gallery.mullion.${mz}`);
    if (!m) return { update() {}, cleanup() {} };
    m.setEnabled(false);
    return {
      update() {},
      cleanup() {
        m.setEnabled(true);
      },
    };
  },
};
