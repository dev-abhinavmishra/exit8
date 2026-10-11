/**
 * intake.gone — the NORTH INTAKE sign over the spawn stretch is simply
 * not there; bare wall where the branding panel hung. Subtle — the
 * corridor's nameplate, gone.
 */
import type { AnomalyDef } from "./types";

export const intakeGone: AnomalyDef = {
  id: "intake.gone",
  displayName: "Intake Sign Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["sign.sign.intake"],
  excludes: ["sign.flip", "sign.wrongway", "sign.mirror"],
  testSeed: "test.intake.gone",
  dangerous: false,
  activate(ctx) {
    const sign = ctx.world.registry.get("sign.sign.intake");
    if (!sign) return { update() {}, cleanup() {} };
    sign.setEnabled(false);
    return {
      update() {},
      cleanup() {
        sign.setEnabled(true);
      },
    };
  },
};
