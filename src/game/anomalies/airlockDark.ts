/**
 * airlock.dark — the warm pool lamp over an airlock is out. The
 * vestibule you judge in sits lit only by corridor spill and the
 * bulkheads — the one place in the run whose light is *warmer* than
 * everywhere else now isn't. Moderate lighting anomaly.
 */
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const airlockDark: AnomalyDef = {
  id: "airlock.dark",
  displayName: "Dead Airlock Pool",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["light.airlock.north", "light.airlock.south"],
  excludes: ["light.out", "light.red", "zone.pulse", "figure.north", "figure.south", "figure.doubles"],
  testSeed: "test.airlock.dark",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const side = ctx.rng.pick(["north", "south"] as const);
    const light = ctx.world.registry.mesh(`light.airlock.${side}`) as unknown as {
      intensity: number;
      diffuse: Color3;
    };
    const base = light.intensity;
    light.intensity = base * 0.12;
    return {
      update() {},
      cleanup() {
        light.intensity = base;
      },
    };
  },
};
