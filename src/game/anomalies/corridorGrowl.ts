import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.growl — the structure groans: a held low caption while the
 * zones' lights rock once, slow, like a load shifting. Chapter III.
 * Systemic / moderate.
 */
export const corridorGrowl: AnomalyDef = {
  id: "corridor.growl",
  displayName: "The Walls Groan",
  chapter: 3,
  category: "systemic",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["platform.gate"],
  excludes: ["corridor.shudder", "corridor.flicker"],
  testSeed: "test.corridor.growl",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones;
    const base = zones.map((z) => z.point.intensity);
    let t = 0;
    let told = false;
    return {
      update(_dt: number) {
        t += _dt;
        if (!told && t > 0.6) {
          told = true;
          ctx.audio.caption("something shifts in the walls", null);
        }
        const wave = Math.sin(t * 0.9) * Math.exp(-t / 14) * 0.3;
        zones.forEach((z, i) => {
          z.point.intensity = base[i]! * (1 - Math.abs(wave));
        });
      },
      cleanup() {
        zones.forEach((z, i) => (z.point.intensity = base[i]!));
      },
    };
  },
};
