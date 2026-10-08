/**
 * exit.sign.gone — the overhead sign over the south airlock doors is
 * simply not there. You walk toward the door that decides your run
 * and nothing marks it. Moderate spatial-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const exitSignGone: AnomalyDef = {
  id: "exit.sign.gone",
  displayName: "Airlock Overhead Sign Missing",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["sign.sign.exit.south"],
  excludes: ["sign", "sign.wrongway", "exit.wrongway", "exit.dark"],
  testSeed: "test.exit.sign.gone",
  dangerous: false,
  activate(ctx) {
    const mesh = ctx.world.registry.mesh("sign.sign.exit.south");
    mesh.setEnabled(false);
    return {
      update() {},
      cleanup() {
        mesh.setEnabled(true);
      },
    };
  },
};
