/**
 * sign.wrongway — the junction wayfinding sign still points at the
 * lift lobby, but its arrow now reads LEFT — toward the records wall,
 * where there is no lift. Everything else on the plate is correct.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.junction";

export const signWrongway: AnomalyDef = {
  id: "sign.wrongway",
  displayName: "Wrong Arrow",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign"],
  testSeed: "test.sign.wrongway",
  dangerous: false,
  activate(ctx) {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    const t = mat?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, arrow: "left", sub: "LIFT LOBBY · WEST SHAFT" });
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
