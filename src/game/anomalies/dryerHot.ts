import { Color3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * dryer.hot — the hand dryer's indicator is lit. Nobody has touched
 * it; a thin breath of warm air leaks off the nozzle every few
 * seconds, ruffling the dark. Moderate, keyed off the registered led.
 */
export const dryerHot: AnomalyDef = {
  id: "dryer.hot",
  displayName: "The Dryer Is Warm",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [5, 100],
  requires: ["wash.dryer.led"],
  excludes: ["dryer.runs"],
  testSeed: "test.dryer.hot",
  dangerous: false,
  activate(ctx) {
    const led = ctx.scene.getMeshByName("wash.dryer.led");
    const mat = led?.material;
    if (!mat || !("emissiveColor" in mat)) return { update() {}, cleanup() {} };
    const m = mat as { emissiveColor: Color3 };
    const saved = m.emissiveColor.clone();
    m.emissiveColor = new Color3(0.85, 0.28, 0.1); // warm amber cycle light
    return {
      update() {},
      cleanup() {
        m.emissiveColor = saved;
      },
    };
  },
};
