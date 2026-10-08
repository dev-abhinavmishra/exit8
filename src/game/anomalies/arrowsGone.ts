/**
 * arrows.gone — every route decal ground into the terrazzo is gone.
 * The floor carries no marks at all this loop. Subtle spatial-class
 * anomaly.
 */
import type { AnomalyDef } from "./types";

const DECALS = ["floor.arrow.10", "floor.arrow.30", "floor.arrow.48"];

export const arrowsGone: AnomalyDef = {
  id: "arrows.gone",
  displayName: "Route Decals Missing",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["floor.arrow.10", "floor.arrow.30", "floor.arrow.48"],
  excludes: ["arrow.points"],
  testSeed: "test.arrows.gone",
  dangerous: false,
  activate(ctx) {
    const meshes = DECALS.map((n) => ctx.world.registry.mesh(n));
    for (const m of meshes) m.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const m of meshes) m.setEnabled(true);
      },
    };
  },
};
