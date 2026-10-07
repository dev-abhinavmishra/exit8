/**
 * light.out — the clinic zone's point light dies and its troffers go dark.
 * A long stretch of corridor at z 32–46 falls into darkness: unmistakable
 * from either end, and it changes the route's silhouette.
 */
import type { AnomalyDef } from "./types";

export const lightOut: AnomalyDef = {
  id: "light.out",
  displayName: "Dead Fixture Run",
  chapter: 1,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["light.zone.clinic"],
  excludes: ["zone.clinic"],
  testSeed: "test.light.out",
  dangerous: false,
  activate(ctx) {
    const zone = ctx.world.zones.find((z) => z.name === "clinic");
    if (!zone) return { update() {}, cleanup() {} };
    const base = zone.point.intensity;
    zone.point.intensity = 0.02;
    for (const t of zone.troffers) t.material = ctx.world.materials.trofferDim;
    return {
      update() {},
      cleanup() {
        zone.point.intensity = base;
        for (const t of zone.troffers) t.material = ctx.world.materials.trofferLit;
      },
    };
  },
};
