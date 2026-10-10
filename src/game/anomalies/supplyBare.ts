/**
 * supply.bare — the cage is stripped: two crates gone outright and the
 * last one tipped on its face at the shelf edge. The stock shelf never
 * sits empty. Moderate object-class, second tell included.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const supplyBare: AnomalyDef = {
  id: "supply.bare",
  displayName: "The Cage Is Bare",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["supply.crate.0", "supply.crate.1", "supply.crate.2"],
  excludes: ["supply.open"],
  testSeed: "test.supply.bare",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const c0 = world.registry.mesh("supply.crate.0");
    const c1 = world.registry.mesh("supply.crate.1");
    const c2 = world.registry.mesh("supply.crate.2");
    c0.setEnabled(false);
    c1.setEnabled(false);
    // last crate tipped on its face at the shelf edge — the ransack tell
    const savedY = c2.position.y;
    const savedRot = c2.rotation.z;
    c2.position.y = savedY - 0.14;
    c2.rotation.z = Math.PI / 2.1;
    return {
      update() {},
      cleanup() {
        c0.setEnabled(true);
        c1.setEnabled(true);
        c2.position.y = savedY;
        c2.rotation.z = savedRot;
      },
    };
  },
};
