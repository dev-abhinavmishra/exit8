/**
 * niche.bare — the peg rail at the staff nook is empty: the hi-vis
 * jacket that always hangs on the middle peg is gone. Subtle — an
 * absence where a habit expected a shape.
 */
import type { AnomalyDef } from "./types";

export const nicheBare: AnomalyDef = {
  id: "niche.bare",
  displayName: "Jacket Gone Off the Hooks",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [12, 100],
  requires: ["niche.jacket"],
  excludes: ["niche.jacket.worn"],
  testSeed: "test.niche.bare",
  dangerous: false,
  activate(ctx) {
    const jacket = ctx.world.registry.get("niche.jacket");
    if (!jacket) return { update() {}, cleanup() {} };
    jacket.setEnabled(false);
    return {
      update() {},
      cleanup() {
        jacket.setEnabled(true);
      },
    };
  },
};
