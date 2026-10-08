/**
 * posters.mirror — every poster on the board flips horizontally. Same
 * paper, same positions, same art — but every word now reads backwards,
 * like the wall is showing you the other side of the print.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const postersMirror: AnomalyDef = {
  id: "posters.mirror",
  displayName: "The Print Reads Backwards",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["poster.0", "poster.1"],
  excludes: ["wall.left.poster", "poster.swapped", "poster.missing", "poster.changed"],
  testSeed: "test.posters.mirror",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const touched: { t: DynamicTexture; d: (typeof POSTER_DEFS)[number] }[] = [];
    POSTER_DEFS.forEach((d, i) => {
      const mesh = ctx.world.registry.mesh(`poster.${i}`);
      const t = (mesh?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
      if (!t) return;
      drawPoster(t, d, true);
      touched.push({ t, d });
    });
    return {
      update() {},
      cleanup() {
        for (const { t, d } of touched) drawPoster(t, d, false);
      },
    };
  },
};
