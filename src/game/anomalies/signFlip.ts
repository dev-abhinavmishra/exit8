/**
 * sign.flip — the hanging SERVICE JUNCTION totem points the wrong way.
 * Subtle: the copy is unchanged; only the arrow direction betrays the run.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { SIGNS } from "../../data/signage";
import { drawSign } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.junction";

export const signFlip: AnomalyDef = {
  id: "sign.flip",
  displayName: "Mispointed Junction Sign",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign"],
  testSeed: "test.sign.flip",
  dangerous: false,
  activate(ctx) {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    const t = mat?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, arrow: "left" });
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
