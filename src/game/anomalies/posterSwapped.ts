/**
 * poster.swapped — two notice-board posters trade places. Nothing new,
 * nothing missing: the order is wrong. Subtle — only counts if you
 * memorized the row.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const posterSwapped: AnomalyDef = {
  id: "poster.swapped",
  displayName: "Posters Out Of Order",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["poster.0", "poster.1"],
  excludes: ["wall.left.poster"],
  testSeed: "test.poster.swapped",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // seeded pair of distinct posters; their DynamicTextures are redrawn
    // with each other's artwork so the physical planes don't move at all
    const n = POSTER_DEFS.length;
    const i = ctx.rng.int(0, n);
    let j = ctx.rng.int(0, n - 1);
    if (j >= i) j += 1;
    const di = POSTER_DEFS[i];
    const dj = POSTER_DEFS[j];
    const ti = (ctx.world.registry.mesh(`poster.${i}`).material as { diffuseTexture?: DynamicTexture } | null)
      ?.diffuseTexture;
    const tj = (ctx.world.registry.mesh(`poster.${j}`).material as { diffuseTexture?: DynamicTexture } | null)
      ?.diffuseTexture;
    if (!ti || !tj || !di || !dj) return { update() {}, cleanup() {} };
    drawPoster(ti, dj);
    drawPoster(tj, di);
    return {
      update() {},
      cleanup() {
        drawPoster(ti, di);
        drawPoster(tj, dj);
      },
    };
  },
};
