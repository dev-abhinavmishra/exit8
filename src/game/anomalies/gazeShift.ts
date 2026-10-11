/**
 * gaze.shift — the walking pictogram on the south INSPECTION POINT
 * sign turns around: figure now strides left, back up the corridor,
 * while the arrow beside it still points right to the filing point.
 * Sign texture redraw like exit.wrongway, but only the man changes
 * direction — the arrow doesn't. Subtle.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.exit.south";

export const gazeShift: AnomalyDef = {
  id: "gaze.shift",
  displayName: "The Figure Walks Away",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "exit.wrongway", "sign.wrongway", "sign.mirror"],
  testSeed: "test.gaze.shift",
  dangerous: false,
  activate(ctx) {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    const t = mat?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, figure: "left" });
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
