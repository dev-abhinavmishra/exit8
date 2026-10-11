/**
 * arrows.gone — every floor arrow is missing from the terrazzo: the
 * painted wayfinding you walked past on the last loop is simply gone,
 * bare floor where the wayfinding used to be. Subtle because they are
 * low and easy to never have memorized.
 */
import type { AnomalyDef } from "./types";

export const arrowsGone: AnomalyDef = {
  id: "arrows.gone",
  displayName: "Route Decals Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: [
    "route.decal.0",
    "route.decal.1",
    "route.decal.2",
    "floor.arrow.10",
    "floor.arrow.30",
    "floor.arrow.48",
  ],
  excludes: ["arrow.extra", "arrow.points", "strip.grows", "guide.missing"],
  testSeed: "test.arrows.gone",
  dangerous: false,
  activate(ctx) {
    const names = [
      "route.decal.0",
      "route.decal.1",
      "route.decal.2",
      "floor.arrow.10",
      "floor.arrow.30",
      "floor.arrow.48",
    ];
    const decals = names
      .map((n) => ctx.world.registry.get(n))
      .filter((m): m is NonNullable<typeof m> => m != null);
    for (const d of decals) d.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const d of decals) d.setEnabled(true);
      },
    };
  },
};
