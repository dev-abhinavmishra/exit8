/**
 * ads.breath — the NORTH lightbox's lamp breathes. A slow swell, about
 * the period of a sleeper's chest, that never settles back to spec.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

const IDX = 0;

export const adsBreath: AnomalyDef = {
  id: "ads.breath",
  displayName: "Lamp Down Cycle",
  chapter: 2,
  category: "lighting",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: [`ads.face.${IDX}`],
  excludes: ["ads.dead"],
  testSeed: "test.ads.breath",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const mat = ctx.world.registry.mesh(`ads.face.${IDX}`).material as StandardMaterial;
    const base = mat.emissiveColor.clone();
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const s = 0.62 * (0.72 + 0.28 * Math.sin((t * Math.PI * 2) / 6));
        mat.emissiveColor = new Color3(s, s, s * 0.97);
      },
      cleanup() {
        mat.emissiveColor = base;
      },
    };
  },
};
