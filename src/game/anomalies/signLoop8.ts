/**
 * sign.loop8 — the mid-route hanging totem still reads INSPECTION
 * LOOP 7 on every other sign in the corridor — except this one. It
 * says 8. Subtle object-class anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.totem.mid";

export const signLoop8: AnomalyDef = {
  id: "sign.loop8",
  displayName: "Wrong Loop Number",
  chapter: 3,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "sign.wrongway", "exit.wrongway", "totem.reversed", "sign.ghost"],
  testSeed: "test.sign.loop8",
  dangerous: false,
  activate(ctx) {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    const t = mat?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, title: "INSPECTION LOOP 8" });
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
