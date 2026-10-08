/**
 * poster.hollow — the staff portrait's eyes are gone. Where Inspector
 * Vance looked out at the route, two dark sockets stare instead.
 * Subtle from range, unmistakable up close. Object-class anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

// the portrait def is the one flagged portrait in POSTER_DEFS
const PORTRAIT_IDX = POSTER_DEFS.findIndex((d) => d.portrait);

export const posterHollow: AnomalyDef = {
  id: "poster.hollow",
  displayName: "Portrait's Eyes Hollow",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: [`poster.${PORTRAIT_IDX}`],
  excludes: ["poster", "wall.left.poster"],
  testSeed: "test.poster.hollow",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const def = POSTER_DEFS[PORTRAIT_IDX];
    const t = (
      ctx.world.registry.mesh(`poster.${PORTRAIT_IDX}`).material as {
        diffuseTexture?: DynamicTexture;
      } | null
    )?.diffuseTexture;
    if (!def || !t) return { update() {}, cleanup() {} };
    drawPoster(t, def, false, true);
    return {
      update() {},
      cleanup() {
        drawPoster(t, def);
      },
    };
  },
};
