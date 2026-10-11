/**
 * temp.drift — the gallery zone's light migrates cold: the point throw
 * and its extras slide from institutional warm toward a bluer daylight
 * over ~20 s, then hold. The troffer glass itself stays — it's the
 * light in the air that changed quality. Subtle because the drift is
 * slow enough to read as imagined until it has fully landed.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const tempDrift: AnomalyDef = {
  id: "temp.drift",
  displayName: "Cooling Light",
  chapter: 3,
  category: "lighting",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: ["light.zone.gallery"],
  excludes: ["light.cold", "corridor.cold", "lights.blackout", "corridor.flicker"],
  testSeed: "test.temp.drift",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zone = ctx.world.zones.find((z) => z.name === "gallery") ?? ctx.world.zones[1]!;
    const warm = zone.point.diffuse.clone();
    const extras = zone.extraLights.map((l): [PointLight, Color3] => [l, l.diffuse.clone()]);
    const cold = new Color3(0.62, 0.75, 0.98);
    const extraCold = extras.map(([l]) => {
      void l;
      return cold.clone();
    });
    const drift = ctx.rng.range(18, 24); // seconds for the slide
    let t = 0;
    return {
      update(dt) {
        if (t >= drift) return;
        t = Math.min(drift, t + dt);
        const k = t / drift;
        const eased = k * k * (3 - 2 * k); // smoothstep — settles, not snaps
        zone.point.diffuse = Color3.Lerp(warm, cold, eased);
        extras.forEach(([l, c], i) => {
          l.diffuse = Color3.Lerp(c, extraCold[i]!, eased);
        });
      },
      cleanup() {
        zone.point.diffuse = warm;
        extras.forEach(([l, c]) => (l.diffuse = c));
      },
    };
  },
};
