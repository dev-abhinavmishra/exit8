import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.cold — the whole passage snaps cold: every zone's light
 * goes pale blue at once. Reads across the entire run. Moderate.
 */
export const corridorCold: AnomalyDef = {
  id: "corridor.cold",
  displayName: "The Air Goes Cold",
  chapter: 2,
  category: "systemic",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["clock.head"],
  excludes: ["corridor.flicker", "lights.surge", "corridor.shudder", "zone.sick"],
  testSeed: "test.corridor.cold",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones;
    const base = zones.map((z) => z.point.diffuse.clone());
    const cold = new Color3(0.72, 0.85, 1.05);
    zones.forEach((z) => (z.point.diffuse = cold.clone()));
    let told = false;
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        if (!told && t > 1.2) {
          told = true;
          ctx.audio.caption("the air goes suddenly cold", null);
        }
      },
      cleanup() {
        zones.forEach((z, i) => (z.point.diffuse = base[i]!));
      },
    };
  },
};
