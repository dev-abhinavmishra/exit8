/**
 * exit.dark — the green EXIT ROUTE sign still hangs in the last
 * stretch, but its lamp is dead: the letters don't glow. Subtle
 * object-class anomaly.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.exitroute";

export const exitDark: AnomalyDef = {
  id: "exit.dark",
  displayName: "Exit Sign Unlit",
  chapter: 3,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "exit.wrongway", "sign.loop8"],
  testSeed: "test.exit.dark",
  dangerous: false,
  activate(ctx) {
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    if (!mat) return { update() {}, cleanup() {} };
    const emissive = mat.emissiveColor.clone();
    mat.emissiveColor = new Color3(0.02, 0.02, 0.02);
    return {
      update() {},
      cleanup() {
        mat.emissiveColor = emissive;
      },
    };
  },
};
