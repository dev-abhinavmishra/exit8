/**
 * poster.dup — two adjacent spots on the notice row carry the same
 * poster. Not swapped, not missing — duplicated. Subtle object-class
 * anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const posterDup: AnomalyDef = {
  id: "poster.dup",
  displayName: "Poster Printed Twice",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: ["poster.0", "poster.1"],
  excludes: ["wall.left.poster", "poster.swapped", "poster.changed", "posters.mirror"],
  testSeed: "test.poster.dup",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const n = POSTER_DEFS.length;
    const i = ctx.rng.int(0, n);
    let j = ctx.rng.int(0, n - 1);
    if (j >= i) j += 1;
    const di = POSTER_DEFS[i];
    const dj = POSTER_DEFS[j];
    const tj = (ctx.world.registry.mesh(`poster.${j}`).material as { diffuseTexture?: DynamicTexture } | null)
      ?.diffuseTexture;
    if (!tj || !di || !dj) return { update() {}, cleanup() {} };
    drawPoster(tj, di);
    return {
      update() {},
      cleanup() {
        drawPoster(tj, dj);
      },
    };
  },
};
