/**
 * light.cold — the corridor runs cold: every lamp's throw shifts from
 * institutional warm to a surgical blue-white, so the whole passage is
 * the same corridor in the wrong light. Unmistakable — it's the only
 * anomaly that changes what light IS.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const lightCold: AnomalyDef = {
  id: "light.cold",
  displayName: "Wrong Light",
  chapter: 3,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [10, 100],
  requires: ["light.zone.entry"],
  excludes: ["lights.blackout", "corridor.flicker"],
  testSeed: "test.light.cold",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const cold = new Color3(0.55, 0.72, 1.0);
    // fixture glass goes cold too — a dedicated lit mat swapped onto
    // every troffer so the warm tubes read blue-white
    const coldLit = new StandardMaterial("anomaly.light.cold.mat", scene);
    coldLit.disableLighting = true;
    coldLit.diffuseColor = new Color3(0, 0, 0);
    coldLit.emissiveColor = new Color3(0.62, 0.78, 1.0);
    const zones = world.zones;
    const saved = zones.map((z) => {
      const d = { point: z.point.diffuse.clone(), extras: [] as [PointLight, Color3][] };
      for (const l of z.extraLights) d.extras.push([l, l.diffuse.clone()]);
      return d;
    });
    for (const z of zones) {
      z.point.diffuse = cold;
      for (const l of z.extraLights) l.diffuse = cold;
      for (const tr of z.troffers) tr.material = coldLit;
    }
    return {
      update() {},
      cleanup() {
        zones.forEach((z, i) => {
          z.point.diffuse = saved[i]!.point;
          saved[i]!.extras.forEach(([l, c]) => (l.diffuse = c));
          for (const tr of z.troffers) tr.material = world.materials.trofferLit;
        });
        coldLit.dispose();
      },
    };
  },
};
