/**
 * zone.pulse — one light zone breathes. The corridor lamps rise to full
 * and sink to a third on a slow, perfectly regular two-and-a-half second
 * cycle, like the circuit is inhaling. The troffer tubes stay lit —
 * only the light they pour changes. Unmistakable lighting anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const zonePulse: AnomalyDef = {
  id: "zone.pulse",
  displayName: "The Zone Breathes",
  chapter: 2,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [25, 100],
  requires: ["light.zone.entry", "light.zone.gallery", "light.zone.clinic", "light.zone.junction"],
  excludes: [
    "light.flicker",
    "light.follows",
    "light.out",
    "light.red",
    "light.delay",
    "light.avoids",
    "zone.sick",
    "lights.buzz",
  ],
  testSeed: "test.zone.pulse",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zone = ctx.rng.pick(ctx.world.zones);
    const base = zone.point.intensity;
    const period = 2.6;
    let t = ctx.rng.range(0, period);
    return {
      update(dt) {
        t += dt;
        zone.point.intensity = base * (0.55 + 0.45 * Math.sin((t * Math.PI * 2) / period));
      },
      cleanup() {
        zone.point.intensity = base;
      },
    };
  },
};
