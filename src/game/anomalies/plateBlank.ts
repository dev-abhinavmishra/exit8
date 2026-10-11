/**
 * plate.blank — the counter plate keeps its border and its sub-line
 * but the number never printed: a framed emptiness where the count
 * should sit, the only sign in the corridor with nothing to say.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const plateBlank: AnomalyDef = {
  id: "plate.blank",
  displayName: "Uncounted",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["sign.attempt.face"],
  excludes: ["plate.ahead", "plate.zero", "plate.countdown", "plate.smeared"],
  testSeed: "test.plate.blank",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === "sign.attempt");
    const t = ctx.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    const { sub: _drop, ...rest } = spec;
    drawSign(t, { ...rest, title: " " });
    return { update() {}, cleanup() {} };
  },
};
