/**
 * intake.gone — the NORTH INTAKE sign over the spawn stretch is
 * simply not there; the branding panel you pass every loop is bare
 * wall. Subtle spatial-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const intakeGone: AnomalyDef = {
  id: "intake.gone",
  displayName: "Intake Sign Missing",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["sign.sign.intake"],
  excludes: ["sign"],
  testSeed: "test.intake.gone",
  dangerous: false,
  activate(ctx) {
    const mesh = ctx.world.registry.mesh("sign.sign.intake");
    mesh.setEnabled(false);
    return {
      update() {},
      cleanup() {
        mesh.setEnabled(true);
      },
    };
  },
};
