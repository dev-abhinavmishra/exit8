/**
 * poster.changed — the REPORT DRIFT poster's copy is rewritten: same
 * border, same colours, same paper — the warning underneath reads
 * differently than it did last loop. Subtle.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

const IDX = 0;
const AMENDED = {
  ...POSTER_DEFS[IDX]!,
  sub: ["DO NOT FILE", "WHAT YOU FILED", "LAST LOOP"],
};

export const posterChanged: AnomalyDef = {
  id: "poster.changed",
  displayName: "Rewritten Poster",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: [`poster.${IDX}`],
  excludes: ["poster", "wall.left.poster", "poster.swapped", "poster.dup", "posters.mirror"],
  testSeed: "test.poster.changed",
  dangerous: false,
  activate(ctx) {
    const t = (
      ctx.world.registry.mesh(`poster.${IDX}`).material as {
        diffuseTexture?: DynamicTexture;
      } | null
    )?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawPoster(t, AMENDED);
    return {
      update() {},
      cleanup() {
        drawPoster(t, POSTER_DEFS[IDX]!);
      },
    };
  },
};
