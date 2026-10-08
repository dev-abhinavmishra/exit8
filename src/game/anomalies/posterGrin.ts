/**
 * poster.grin — Inspector Vance's engraved portrait is still smiling —
 * wider than it should be, teeth showing, eyes narrowed. Same trick as
 * poster.hollow: the portrait repaints and nobody reprints this wall.
 * Subtle from range, unmistakable up close. Object-class anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const PORTRAIT_IDX = POSTER_DEFS.findIndex((d) => d.portrait);

export const posterGrin: AnomalyDef = {
  id: "poster.grin",
  displayName: "Portrait's Smile Widened",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: [`poster.${PORTRAIT_IDX}`],
  excludes: ["poster", "wall.left.poster", "poster.hollow"],
  testSeed: "test.poster.grin",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const def = POSTER_DEFS[PORTRAIT_IDX];
    const t = (
      ctx.world.registry.mesh(`poster.${PORTRAIT_IDX}`).material as {
        diffuseTexture?: DynamicTexture;
      } | null
    )?.diffuseTexture;
    if (!def || !t) return { update() {}, cleanup() {} };
    drawPoster(t, def, false, false, true);
    return {
      update() {},
      cleanup() {
        drawPoster(t, def);
      },
    };
  },
};
