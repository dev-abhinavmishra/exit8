/**
 * sign.mirror — the mid-route INSPECTION LOOP 7 totem reads backwards,
 * every glyph mirrored like it was printed on the far side of the
 * panel. You have to actually read the sign to catch it — pure
 * memorization. Subtle object-class anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

const SPEC_ID = "sign.totem.mid";

export const signMirror: AnomalyDef = {
  id: "sign.mirror",
  displayName: "Totem Reads Backwards",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "sign.loop8", "sign.ghost", "totem.reversed", "totem.gone"],
  testSeed: "test.sign.mirror",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const t = ctx.world.materials.sign.get(SPEC_ID)?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, spec, true);
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
