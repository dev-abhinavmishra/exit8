/**
 * ext.missing — the wall-mounted extinguisher beside the fire point is
 * simply not there. The red cabinet, the sign, the bracket shadow on the
 * wall all remain; only the canister is gone. Pure memorization — players
 * who never registered it never miss it.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const extGone: AnomalyDef = {
  id: "ext.missing",
  displayName: "Missing Extinguisher",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["prop.extinguisher"],
  excludes: ["extinguisher"],
  testSeed: "test.ext.missing",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const unit = world.registry.get("prop.extinguisher");
    unit.setEnabled(false);
    return {
      update() {},
      cleanup() {
        unit.setEnabled(true);
      },
    };
  },
};
