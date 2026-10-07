/**
 * temp.drift — the gallery zone's light migrates from warm ~3500 K to a
 * clinical ~6500 K over ~20 s, then holds. Subtle: the corridor's color
 * temperature is wrong by the time you notice it changed.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

const DRIFT_S = 20;
const COOL = new Color3(0.82, 0.9, 1.0);

export const tempDrift: AnomalyDef = {
  id: "temp.drift",
  displayName: "Cooling Light",
  chapter: 3,
  category: "lighting",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["light.zone.gallery"],
  excludes: ["zone.gallery"],
  testSeed: "test.temp.drift",
  dangerous: false,
  activate(ctx) {
    const zone = ctx.world.zones.find((z) => z.name === "gallery");
    if (!zone) return { update() {}, cleanup() {} };
    const warm = zone.baseDiffuse.clone();
    let t = 0;
    return {
      update(dt) {
        if (t >= DRIFT_S) return;
        t = Math.min(DRIFT_S, t + dt);
        const k = t / DRIFT_S;
        // ease-out so the shift is fastest early, then settles
        const e = 1 - (1 - k) * (1 - k);
        zone.point.diffuse = Color3.Lerp(warm, COOL, e);
      },
      cleanup() {
        zone.point.diffuse = warm;
      },
    };
  },
};
