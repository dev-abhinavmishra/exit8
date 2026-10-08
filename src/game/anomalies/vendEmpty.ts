/**
 * vend.empty — the cold dispense unit is still lit, still humming, but
 * every shelf behind the glass is bare and a printed OUT OF STOCK
 * strip sits where the product pride used to be. Subtle-to-moderate.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawVendingFace } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const vendEmpty: AnomalyDef = {
  id: "vend.empty",
  displayName: "Vending Shelves Bare",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [10, 100],
  requires: ["prop.vending"],
  excludes: ["vend.dead", "vend.gone"],
  testSeed: "test.vend.empty",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const face = ctx.world.registry
      .get("prop.vending")
      .getChildMeshes()
      .find((m) => m.name === "prop.vend.face");
    const t = (face?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawVendingFace(t, true);
    return {
      update() {},
      cleanup() {
        drawVendingFace(t, false);
      },
    };
  },
};
