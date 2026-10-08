/**
 * air.haze — the corridor air thickens. Fog density roughly doubles and the
 * ambient light drops a notch; the far end stops resolving. Moderate —
 * most players feel it before they name it.
 */
import type { AnomalyDef } from "./types";

export const airHaze: AnomalyDef = {
  id: "air.haze",
  displayName: "Pressure Front",
  chapter: 3,
  category: "systemic",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["light.zone.junction"],
  excludes: ["atmosphere"],
  testSeed: "test.air.haze",
  dangerous: false,
  activate(ctx) {
    const scene = ctx.scene;
    const hemi = ctx.world.hemi;
    const fog0 = scene.fogDensity;
    const hemi0 = hemi.intensity;
    scene.fogDensity = fog0 * 2.1;
    hemi.intensity = hemi0 * 0.82;
    return {
      update() {},
      cleanup() {
        scene.fogDensity = fog0;
        hemi.intensity = hemi0;
      },
    };
  },
};
