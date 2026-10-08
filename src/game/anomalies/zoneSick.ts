/**
 * zone.sick — one light zone's tubes have gone the wrong color: the
 * whole stretch bathes in a sick green like an old fluorescent with a
 * dying phosphor, while the troffer panels themselves read normal.
 * Subtle lighting-class anomaly.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const zoneSick: AnomalyDef = {
  id: "zone.sick",
  displayName: "Tube Color Gone Sick",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [15, 100],
  requires: ["light.zone.gallery"],
  excludes: ["zone.gallery", "zone.records", "zone.clinic", "zone.junction", "zone.entry", "light.follows"],
  testSeed: "test.zone.sick",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const name = ctx.rng.pick(["entry", "gallery", "clinic", "junction"]);
    const zone = ctx.world.zones.find((z) => z.name === name);
    if (!zone) return { update() {}, cleanup() {} };
    const baseDiffuse = zone.point.diffuse.clone();
    const baseIntensity = zone.point.intensity;
    zone.point.diffuse = new Color3(0.52, 0.95, 0.58);
    zone.point.intensity = baseIntensity * 0.88;
    return {
      update() {},
      cleanup() {
        zone.point.diffuse = baseDiffuse;
        zone.point.intensity = baseIntensity;
      },
    };
  },
};
