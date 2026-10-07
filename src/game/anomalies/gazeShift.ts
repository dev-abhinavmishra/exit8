/**
 * gaze.shift — the little walking figure on the south inspection sign
 * has turned around. It walks BACK up the corridor, away from the
 * arrow it has always followed. Subtle — you only catch it if the
 * pictogram is part of your baseline.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { SignSpec } from "../../data/signage";
import { SIGNS } from "../../data/signage";
import { drawSign } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const SPEC_ID = "sign.exit.south";

export const gazeShift: AnomalyDef = {
  id: "gaze.shift",
  displayName: "The Figure Walks Away",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["sign.sign.exit.south"],
  excludes: [],
  testSeed: "test.gaze.shift",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const tex = (ctx.world.materials.sign.get(SPEC_ID) as { diffuseTexture?: DynamicTexture } | undefined)
      ?.diffuseTexture;
    if (!spec || !tex) return { update() {}, cleanup() {} };
    const flipped: SignSpec = {
      ...spec,
      figure: spec.figure === "right" ? "left" : "right",
    };
    drawSign(tex, flipped);
    return {
      update() {},
      cleanup() {
        drawSign(tex, spec);
      },
    };
  },
};
