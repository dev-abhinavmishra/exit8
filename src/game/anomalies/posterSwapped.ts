/**
 * poster.swapped — two notice-row posters trade artwork: each frame
 * still holds a real print, just the wrong one. Subtle — a pair you
 * have to have memorized to catch.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const posterSwapped: AnomalyDef = {
  id: "poster.swapped",
  displayName: "Posters Out Of Order",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["poster.0", "poster.1"],
  excludes: ["poster", "wall.left.poster", "poster.changed", "poster.dup", "posters.mirror"],
  testSeed: "test.poster.swapped",
  dangerous: false,
  activate(ctx) {
    const texAt = (i: number) =>
      (
        ctx.world.registry.mesh(`poster.${i}`).material as {
          diffuseTexture?: DynamicTexture;
        } | null
      )?.diffuseTexture;
    const a = texAt(0);
    const b = texAt(1);
    if (!a || !b) return { update() {}, cleanup() {} };
    drawPoster(a, POSTER_DEFS[1]!);
    drawPoster(b, POSTER_DEFS[0]!);
    return {
      update() {},
      cleanup() {
        drawPoster(a, POSTER_DEFS[0]!);
        drawPoster(b, POSTER_DEFS[1]!);
      },
    };
  },
};
