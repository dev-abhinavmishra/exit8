/**
 * ads.watch — the SOUTH lightbox's mitten notice is a portrait tonight,
 * and the portrait's eyes keep finding you. Step far enough along the
 * walk and the pupils slide to keep pace — five steps, no more.
 */
import { AD_DEFS, drawAd } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

const IDX = 2;

export const adsWatch: AnomalyDef = {
  id: "ads.watch",
  displayName: "It Found You First",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: [`ads.face.${IDX}`],
  excludes: ["ads.face", "ads.swap", "ads.dead"],
  testSeed: "test.ads.watch",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const t = (
      ctx.world.registry.mesh(`ads.face.${IDX}`).material as {
        emissiveTexture?: DynamicTexture;
      } | null
    )?.emissiveTexture;
    if (!t) return { update() {}, cleanup() {} };
    const box = ctx.world.registry.get(`ads.face.${IDX}`);
    let lastStep = 99;
    drawAd(t, AD_DEFS[IDX]!, true, 0);
    return {
      update() {
        const p = ctx.player.position;
        const dx = box.position.x - p.x;
        const dz = box.position.z - p.z;
        // quantize to 5 steps so we redraw only on a crossing
        const step = Math.max(-2, Math.min(2, Math.round(Math.atan2(dx, dz) * 3)));
        if (step !== lastStep) {
          lastStep = step;
          drawAd(t, AD_DEFS[IDX]!, true, step / 3);
        }
      },
      cleanup() {
        drawAd(t, AD_DEFS[IDX]!);
      },
    };
  },
};
