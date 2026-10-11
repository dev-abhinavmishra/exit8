import { Color3 } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * help.lit — the help point's status dome burns amber like somebody
 * pressed it. Nobody is on shift but you. Moderate.
 */
export const helpLit: AnomalyDef = {
  id: "help.lit",
  displayName: "The Help Point Is Lit",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["help.lamp"],
  excludes: ["help", "help.voice"],
  testSeed: "test.help.lit",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const lamp = ctx.world.registry.get("help.lamp") as AbstractMesh;
    const mat = lamp.material as StandardMaterial;
    const e0 = mat.emissiveColor.clone();
    mat.emissiveColor = new Color3(0.9, 0.5, 0.1);
    return {
      update() {},
      cleanup() {
        mat.emissiveColor = e0;
      },
    };
  },
};
