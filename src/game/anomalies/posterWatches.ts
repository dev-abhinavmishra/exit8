/**
 * poster.watches — Inspector Vance's engraved eyes are suddenly
 * readable, and the pupils slide to follow you down the corridor.
 * A few centimetres of canvas redraw; the whole portrait turns
 * watchful. Moderate — unmistakable the moment you test it.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const PORTRAIT_IDX = POSTER_DEFS.findIndex((d) => d.portrait);
const STEPS = 7;

export const posterWatches: AnomalyDef = {
  id: "poster.watches",
  displayName: "Portrait's Eyes Follow",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: [`poster.${PORTRAIT_IDX}`],
  excludes: ["poster", "wall.left.poster", "poster.hollow", "poster.grin"],
  testSeed: "test.poster.watches",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const def = POSTER_DEFS[PORTRAIT_IDX];
    const mesh = ctx.world.registry.mesh(`poster.${PORTRAIT_IDX}`);
    const t = (mesh?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!def || !mesh || !t) return { update() {}, cleanup() {} };
    const face = mesh.getAbsolutePosition();
    let shown = 99; // sentinel forces a first repaint
    const paint = (gaze: number) => {
      shown = gaze;
      drawPoster(t, def, false, false, false, gaze);
    };
    return {
      update() {
        const p = ctx.player.position;
        // horizontal angle from the poster's wall into the corridor —
        // pupils track the walk line in discrete engraved steps
        const dx = p.z - face.z;
        const gaze = Math.max(-1, Math.min(1, dx / 9));
        let step = Math.round(gaze * STEPS) / STEPS;
        if (step === 0) step = 0.001; // gaze 0 draws plain eyes; epsilon keeps them
        if (step !== shown) paint(step);
      },
      cleanup() {
        drawPoster(t, def);
      },
    };
  },
};
