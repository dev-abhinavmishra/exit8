/**
 * plate.zero — the counter reads PASS 00, a number it was never
 * built to show: no pass yet taken, none yet possible. The loop
 * admits nothing happened.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const plateZero: AnomalyDef = {
  id: "plate.zero",
  displayName: "Pass Zero",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["sign.attempt.face"],
  excludes: ["plate.ahead", "plate.countdown", "plate.blank", "plate.smeared"],
  testSeed: "test.plate.zero",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const spec = SIGNS.find((s) => s.id === "sign.attempt");
    const t = ctx.world.materials.sign.get("sign.attempt")?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, title: "PASS 00" });
    return { update() {}, cleanup() {} };
  },
};
