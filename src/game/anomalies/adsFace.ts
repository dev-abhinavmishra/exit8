/**
 * ads.face — the MIDDLE lightbox no longer shows the route survey —
 * behind its glass a person waits, lit too evenly, head too large for
 * the frame. Whoever bought the slot, it wasn't the civic archive.
 */
import { AD_DEFS, drawAd } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

const IDX = 1;

export const adsFace: AnomalyDef = {
  id: "ads.face",
  displayName: "The Slot Sold",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: [`ads.face.${IDX}`],
  excludes: ["ads.swap", "ads.dead", "ads.watch"],
  testSeed: "test.ads.face",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const t = (
      ctx.world.registry.mesh(`ads.face.${IDX}`).material as {
        emissiveTexture?: DynamicTexture;
      } | null
    )?.emissiveTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawAd(t, AD_DEFS[IDX]!, true, 0);
    return {
      update() {},
      cleanup() {
        drawAd(t, AD_DEFS[IDX]!);
      },
    };
  },
};
