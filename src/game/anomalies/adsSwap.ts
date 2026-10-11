/**
 * ads.swap — all three lightboxes run the same ad tonight. Not a loop
 * of three slots — one image, copied, wrong each time you recount it.
 */
import { AD_DEFS, drawAd } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const adsSwap: AnomalyDef = {
  id: "ads.swap",
  displayName: "Single Buyer",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["ads.face.0", "ads.face.1", "ads.face.2"],
  excludes: ["ads.face", "ads.dead", "ads.watch"],
  testSeed: "test.ads.swap",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const texs = [0, 1, 2].map(
      (i) =>
        (
          ctx.world.registry.mesh(`ads.face.${i}`).material as {
            emissiveTexture?: DynamicTexture;
          } | null
        )?.emissiveTexture,
    );
    if (texs.some((t) => !t)) return { update() {}, cleanup() {} };
    texs.forEach((t) => drawAd(t!, AD_DEFS[0]!));
    return {
      update() {},
      cleanup() {
        texs.forEach((t, i) => drawAd(t!, AD_DEFS[i]!));
      },
    };
  },
};
