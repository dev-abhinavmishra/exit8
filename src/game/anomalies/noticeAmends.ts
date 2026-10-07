/**
 * notice.amends — the NOTICE board above the north inner door now reads
 * differently. Subtle: the paper, layout, and typography are identical —
 * only the bulletin line has been amended, and only someone who read the
 * original will catch it.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { SIGNS } from "../../data/signage";
import { drawSign } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.notice.board";

export const noticeAmends: AnomalyDef = {
  id: "notice.amends",
  displayName: "Amended Bulletin",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign"],
  testSeed: "test.notice.amends",
  dangerous: false,
  activate(ctx) {
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mat = ctx.world.materials.sign.get(SPEC_ID);
    const t = mat?.diffuseTexture as DynamicTexture | undefined;
    if (!spec || !t) return { update() {}, cleanup() {} };
    drawSign(t, { ...spec, sub: "INSPECTIONS SUSPENDED UNTIL FURTHER NOTICE" });
    return {
      update() {},
      cleanup() {
        drawSign(t, spec);
      },
    };
  },
};
