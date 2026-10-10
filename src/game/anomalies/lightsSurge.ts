/**
 * lights.surge — one stretch of the corridor is running too hot. Its
 * zone feed over-volts: the light pool on the floor burns brighter and
 * whiter than the rest of the run while the troffer panels themselves
 * read normal. The wrong direction for a lighting fault — nothing
 * failed, it's giving too much. Moderate.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const lightsSurge: AnomalyDef = {
  id: "lights.surge",
  displayName: "Over-fed Circuit",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [15, 100],
  requires: ["light.zone.gallery"],
  excludes: [
    "zone.gallery",
    "zone.records",
    "zone.clinic",
    "zone.junction",
    "zone.entry",
    "zone.sick",
    "light.follows",
    "lights.blackout",
    "light.out",
    "light.delay",
  ],
  testSeed: "test.lights.surge",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const name = ctx.rng.pick(["entry", "gallery", "clinic", "junction"]);
    const zone = ctx.world.zones.find((z) => z.name === name);
    if (!zone) return { update() {}, cleanup() {} };
    const baseDiffuse = zone.point.diffuse.clone();
    const baseIntensity = zone.point.intensity;
    const baseExtra = zone.extraLights.map((l) => l.intensity);
    // over-volt: hotter and a shade whiter than spec — the same fault
    // signature a real fluorescent runs before the ballast cooks
    zone.point.diffuse = new Color3(1.0, 0.98, 0.9);
    zone.point.intensity = baseIntensity * 1.55;
    for (const l of zone.extraLights) l.intensity *= 1.5;
    return {
      update() {},
      cleanup() {
        zone.point.diffuse = baseDiffuse;
        zone.point.intensity = baseIntensity;
        zone.extraLights.forEach((l, i) => (l.intensity = baseExtra[i] ?? l.intensity));
      },
    };
  },
};
