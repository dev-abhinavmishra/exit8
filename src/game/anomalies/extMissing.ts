/**
 * ext.missing — the extinguisher beside the fire point is gone:
 * cylinder, valve and hose stub lifted off, while the wall bracket,
 * cabinet and FIRE plaque all remain. Subtle — an absent red read.
 */
import type { AnomalyDef } from "./types";

export const extMissing: AnomalyDef = {
  id: "ext.missing",
  displayName: "Missing Extinguisher",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["prop.extinguisher"],
  excludes: ["fire.open"],
  testSeed: "test.ext.missing",
  dangerous: false,
  activate(ctx) {
    const ext = ctx.world.registry.get("prop.extinguisher");
    if (!ext) return { update() {}, cleanup() {} };
    ext.setEnabled(false);
    return {
      update() {},
      cleanup() {
        ext.setEnabled(true);
      },
    };
  },
};
