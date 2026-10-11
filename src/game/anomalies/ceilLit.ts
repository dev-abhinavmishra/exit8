import { Color3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * ceil.lit — the panel is seated, but the plenum is lit from within:
 * a warm sodium glow leaks the seam all around the plate — the void
 * above the corridor should be dark.
 */
export const ceilLit: AnomalyDef = {
  id: "ceil.lit",
  displayName: "Light In The Plenum",
  chapter: 2,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["ceil.void"],
  excludes: ["ceil.ajar", "ceil.open", "ceil.fallen", "ceil.cord"],
  testSeed: "test.ceil.lit",
  dangerous: false,
  activate(ctx) {
    const v = ctx.scene.getMeshByName("ceil.void");
    const mat = v?.material;
    if (!mat || !("emissiveColor" in mat)) return { update() {}, cleanup() {} };
    const m = mat as { emissiveColor: Color3 };
    const saved = m.emissiveColor.clone();
    m.emissiveColor = new Color3(0.9, 0.62, 0.3); // sodium, not the corridor's cool
    return {
      update() {},
      cleanup() {
        m.emissiveColor = saved;
      },
    };
  },
};
