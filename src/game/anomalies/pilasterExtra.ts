/**
 * pilaster.extra — a fifth column stands on the west wall at z≈38,
 * off-rhythm between the z 33 and z 43.5 pair. The colonnade's spacing
 * never varies. Moderate object-class.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const pilasterExtra: AnomalyDef = {
  id: "pilaster.extra",
  displayName: "A Column Too Many",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["col.w.1"],
  excludes: ["pilaster.gone"],
  testSeed: "test.pilaster.extra",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    // clone of col.w.1's shaft assembly at the off-rhythm spot — the new
    // column reuses the same three-part recipe so it blends in
    const src = world.registry.mesh("col.w.1");
    const dupe = src.clone("anomaly.pilaster.dupe", null)!;
    dupe.parent = world.root;
    dupe.position = src.position.clone();
    dupe.position.z = 38.0;
    dupe.setEnabled(true);
    return {
      update() {},
      cleanup() {
        dupe.dispose(false, true);
      },
    };
  },
};
