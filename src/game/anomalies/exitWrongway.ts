/**
 * exit.wrongway — the green EXIT ROUTE sign still glows, but its
 * running figure and arrow now point back up the corridor — away
 * from the south inspection point. Subtle object-class anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.exitroute";

export const exitWrongway: AnomalyDef = {
  id: "exit.wrongway",
  displayName: "Exit Sign Wrong Way",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "sign.wrongway"],
  testSeed: "test.exit.wrongway",
  dangerous: false,
  activate(ctx) {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    const t = mat?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, arrow: "left", figure: "left" });
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
