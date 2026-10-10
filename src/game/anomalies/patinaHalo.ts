import { Color3 } from "@babylonjs/core";
import type { AbstractMesh } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * patina.halo — the faint ceiling stain over z 41 darkens and spreads
 * through the loop: damp is getting in somewhere. Lighting-adjacent,
 * subtle.
 */
export const patinaHalo: AnomalyDef = {
  id: "patina.halo.spread",
  displayName: "The Stain Is Growing",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["patina.halo"],
  excludes: [],
  testSeed: "test.patina.halo",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const halo = ctx.world.registry.get("patina.halo");
    const mat = (halo as AbstractMesh).material as StandardMaterial;
    const d0 = mat.diffuseColor.clone();
    const a0 = mat.alpha;
    const s0 = halo.scaling.clone();
    let t = 0;
    return {
      update(dt: number) {
        t += dt;
        const k = Math.min(1, t / 90);
        halo.scaling.x = s0.x * (1 + k * 0.9);
        halo.scaling.y = s0.y * (1 + k * 0.9);
        mat.diffuseColor = new Color3(0.3 - k * 0.12, 0.26 - k * 0.11, 0.18 - k * 0.08);
        mat.alpha = a0 + k * 0.3;
      },
      cleanup() {
        halo.scaling.copyFrom(s0);
        mat.diffuseColor = d0;
        mat.alpha = a0;
      },
    };
  },
};
