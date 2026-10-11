/**
 * posters.mirror — every print on the notice row is mirrored: borders
 * and art still hang straight, but all the type reads backwards like a
 * reflection. Subtle until you try to read it.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const postersMirror: AnomalyDef = {
  id: "posters.mirror",
  displayName: "Mirrored Prints",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["poster.0", "poster.1", "poster.2"],
  excludes: [
    "poster",
    "wall.left.poster",
    "poster.changed",
    "poster.dup",
    "poster.swapped",
    "poster.grin",
    "poster.hollow",
    "poster.watches",
  ],
  testSeed: "test.posters.mirror",
  dangerous: false,
  activate(ctx) {
    const touched: { t: DynamicTexture; i: number }[] = [];
    POSTER_DEFS.forEach((d, i) => {
      const t = (
        ctx.world.registry.mesh(`poster.${i}`).material as {
          diffuseTexture?: DynamicTexture;
        } | null
      )?.diffuseTexture;
      if (!t) return;
      drawPoster(t, d, true);
      touched.push({ t, i });
    });
    return {
      update() {},
      cleanup() {
        for (const { t, i } of touched) drawPoster(t, POSTER_DEFS[i]!);
      },
    };
  },
};
