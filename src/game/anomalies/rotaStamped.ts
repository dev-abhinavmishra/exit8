/**
 * rota.stamped — the duty board by the intake has been stamped again.
 * Across the typed staffing table sits a big red UNDER REVIEW mark
 * where only the small amber AUDITED stamp belongs. A document that
 * was settled is unsettled — moderate, right beside spawn.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawRotaBoard } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const rotaStamped: AnomalyDef = {
  id: "rota.stamped",
  displayName: "Staffing Under Review",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["rota.face"],
  excludes: ["notice.amends", "sign.mirror"],
  testSeed: "test.rota.stamped",
  dangerous: false,
  activate(ctx) {
    const face = ctx.world.registry.mesh("rota.face");
    const tex = (face.material as { diffuseTexture?: DynamicTexture }).diffuseTexture;
    if (tex) drawRotaBoard(tex, true);
    return {
      update() {},
      cleanup() {
        if (tex) drawRotaBoard(tex, false);
      },
    };
  },
};
