/**
 * poster.dup — two spots on the notice row carry the same poster: the
 * rng-picked second frame reprints the first poster's art verbatim.
 * Not swapped, not missing — duplicated. Subtle.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const posterDup: AnomalyDef = {
  id: "poster.dup",
  displayName: "Duplicated Poster",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["poster.0", "poster.1", "poster.2"],
  excludes: ["poster", "wall.left.poster", "poster.changed", "poster.swapped", "posters.mirror"],
  testSeed: "test.poster.dup",
  dangerous: false,
  activate(ctx) {
    const b = 1 + Math.floor(ctx.rng.draw() * (POSTER_DEFS.length - 1));
    const t = (
      ctx.world.registry.mesh(`poster.${b}`).material as {
        diffuseTexture?: DynamicTexture;
      } | null
    )?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawPoster(t, POSTER_DEFS[0]!);
    return {
      update() {},
      cleanup() {
        drawPoster(t, POSTER_DEFS[b]!);
      },
    };
  },
};
