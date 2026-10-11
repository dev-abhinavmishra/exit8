import { Color3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * well.lit — the cover is still bolted down, but something is lit
 * underneath: a cold blue-green glow leaks through the narrow seam
 * between the plate and the rim. In the corridor's light it reads as
 * a thin lit outline on the floor where the floor should be dark.
 */
export const wellLit: AnomalyDef = {
  id: "well.lit",
  displayName: "Light From Below",
  chapter: 2,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["well.pit"],
  excludes: ["well.ajar", "well.lifted", "well.grip", "well.riser"],
  testSeed: "test.well.lit",
  dangerous: false,
  activate(ctx) {
    const pit = ctx.scene.getMeshByName("well.pit");
    const mat = pit?.material;
    if (!mat || !("emissiveColor" in mat)) return { update() {}, cleanup() {} };
    const m = mat as { emissiveColor: Color3 };
    const saved = m.emissiveColor.clone();
    m.emissiveColor = new Color3(0.35, 0.85, 0.8);
    return {
      update() {},
      cleanup() {
        m.emissiveColor = saved;
      },
    };
  },
};
