/**
 * bell.gone — the service bell on the clinic counter is simply not
 * there; the counter still carries tray and paperwork but nothing
 * to ring. Subtle object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const bellGone: AnomalyDef = {
  id: "bell.gone",
  displayName: "Counter Bell Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["clinic.counter"],
  excludes: [],
  testSeed: "test.bell.gone",
  dangerous: false,
  activate(ctx) {
    const bell = ctx.scene.getMeshByName("clinic.counter.bell");
    if (!bell) return { update() {}, cleanup() {} };
    bell.setEnabled(false);
    return {
      update() {},
      cleanup() {
        bell.setEnabled(true);
      },
    };
  },
};
