/**
 * bell.gone — the service bell on the clinic counter is simply not
 * there; the counter top runs bare where the little steel dome sat.
 * Subtle — a fingertip-sized absence on a memorized surface.
 */
import type { AnomalyDef } from "./types";

export const bellGone: AnomalyDef = {
  id: "bell.gone",
  displayName: "Counter Bell Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["clinic.counter.bell"],
  excludes: [],
  testSeed: "test.bell.gone",
  dangerous: false,
  activate(ctx) {
    const bell = ctx.world.registry.get("clinic.counter.bell");
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
