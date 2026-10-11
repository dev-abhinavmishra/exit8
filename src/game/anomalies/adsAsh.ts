/**
 * ads.ash — the three column lightboxes die in sequence down the
 * corridor: lamp, lamp, lamp, each with a tired crackle, then all
 * three stay ash-dark. Not a blackout — a cascade you can watch walk.
 */
import { Color3 } from "@babylonjs/core";
import type { Vector3 } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

const FACES = ["ads.face.0", "ads.face.1", "ads.face.2"];
const DIE_AT = [2.0, 5.5, 9.0];

export const adsAsh: AnomalyDef = {
  id: "ads.ash",
  displayName: "Ash Sequence",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["ads.face.0"],
  excludes: ["ads.dead", "ads.breath", "ads.face", "ads.swap", "ads.watch"],
  testSeed: "test.ads.ash",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const saved = new Map<StandardMaterial, Color3>();
    const pos = new Map<StandardMaterial, Vector3>();
    for (const name of FACES) {
      const mesh = ctx.world.registry.mesh(name);
      const mat = mesh?.material as StandardMaterial | null;
      if (!mat) continue;
      saved.set(mat, mat.emissiveColor.clone());
      pos.set(mat, mesh!.getAbsolutePosition().clone());
    }
    let t = 0;
    let died = 0;
    return {
      update(dt: number) {
        if (died >= FACES.length) return;
        t += dt;
        while (died < FACES.length && t >= DIE_AT[died]!) {
          const mesh = ctx.world.registry.mesh(FACES[died]!);
          const mat = mesh?.material as StandardMaterial | null;
          if (mat) {
            mat.emissiveColor = new Color3(0.02, 0.02, 0.02);
            const p = pos.get(mat);
            if (p && !ctx.reducedEffects) ctx.audio.playCrackle(p);
          }
          died++;
        }
      },
      cleanup() {
        for (const [mat, c] of saved) mat.emissiveColor = c.clone();
      },
    };
  },
};
