/**
 * hatch.gone — the maintenance hatch plate on the west wall is
 * simply not there — painted-over wall where the access panel always
 * was. Subtle object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const hatchGone: AnomalyDef = {
  id: "hatch.gone",
  displayName: "Hatch Sealed Over",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["hatch.plate"],
  excludes: ["hatch.open"],
  testSeed: "test.hatch.gone",
  dangerous: false,
  activate(ctx) {
    const mesh = ctx.world.registry.mesh("hatch.plate");
    mesh.setEnabled(false);
    return {
      update() {},
      cleanup() {
        mesh.setEnabled(true);
      },
    };
  },
};
