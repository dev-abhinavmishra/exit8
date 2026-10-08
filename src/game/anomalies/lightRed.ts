/**
 * light.red — one zone's point light turns a deep red and its troffers
 * burn the same blood-lit tone. The corridor zone you know is the
 * color of a warning lamp. Unmistakable lighting-class anomaly —
 * the signature dread beat of the reference.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

const ZONES = ["entry", "gallery", "clinic", "junction"];

export const lightRed: AnomalyDef = {
  id: "light.red",
  displayName: "Zone Lights Blood-Red",
  chapter: 3,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["light.zone.entry", "light.zone.gallery", "light.zone.clinic", "light.zone.junction"],
  excludes: [
    "zone.clinic",
    "light.out",
    "light.flicker",
    "light.delay",
    "light.follows",
    "light.avoids",
    "shaft.glow",
    "material.swap",
    "temp.drift",
  ],
  testSeed: "test.light.red",
  dangerous: false,
  activate(ctx) {
    const name = ctx.rng.pick(ZONES);
    const zone = ctx.world.zones.find((z) => z.name === name);
    if (!zone) return { update() {}, cleanup() {} };
    const baseDiffuse = zone.point.diffuse.clone();
    const baseIntensity = zone.point.intensity;
    zone.point.diffuse = new Color3(0.9, 0.08, 0.05);
    zone.point.intensity = baseIntensity * 0.75;
    const redTroffer = new StandardMaterial("anomaly.lightRed.troffer", ctx.scene);
    redTroffer.emissiveColor = new Color3(0.85, 0.1, 0.07).scale(1.3);
    redTroffer.disableLighting = true;
    const litMat = ctx.world.materials.trofferLit;
    for (const t of zone.troffers) t.material = redTroffer;
    return {
      update() {},
      cleanup() {
        zone.point.diffuse = baseDiffuse;
        zone.point.intensity = baseIntensity;
        for (const t of zone.troffers) t.material = litMat;
        redTroffer.dispose();
      },
    };
  },
};
