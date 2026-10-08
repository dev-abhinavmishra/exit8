/**
 * material.swap — the first notice-board poster renders as black glass:
 * a dark, faintly reflective rectangle where a paper poster was. Subtle.
 */
import type { AnomalyDef } from "./types";

export const materialSwap: AnomalyDef = {
  id: "material.swap",
  displayName: "Black Mirror Poster",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["poster.0"],
  excludes: ["wall.left.poster"],
  testSeed: "test.material.swap",
  dangerous: false,
  activate(ctx) {
    const p = ctx.world.registry.mesh("poster.0");
    const orig = p.material;
    p.material = ctx.world.materials.darkGlass;
    return {
      update() {},
      cleanup() {
        p.material = orig;
      },
    };
  },
};
