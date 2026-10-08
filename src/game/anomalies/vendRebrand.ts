/**
 * vend.rebrand — the vending machine's lit brand band renames itself.
 * The shelves are stocked, the face is lit, everything is right except
 * the operator line, which now reads something it never did. You have
 * to have read it to catch it. Subtle memorization anomaly.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { drawVendingFace } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const REWRITES = ["NIGHT CANTEEN SERVICES", "NO CANTEEN SERVICES", "CWA CANTEEN — CLOSED"];

export const vendRebrand: AnomalyDef = {
  id: "vend.rebrand",
  displayName: "Rebranded Dispenser",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["prop.vending"],
  excludes: ["vend.dead", "vend.empty", "vend.dispensed"],
  testSeed: "test.vend.rebrand",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, rng } = ctx;
    const face = scene.getMeshByName("prop.vend.face");
    const mat = face?.material;
    if (!(face && mat instanceof StandardMaterial)) return { update() {}, cleanup() {} };
    const tex = mat.diffuseTexture;
    if (!(tex instanceof DynamicTexture)) return { update() {}, cleanup() {} };
    drawVendingFace(tex, false, rng.pick(REWRITES));
    tex.update();
    return {
      update() {},
      cleanup() {
        drawVendingFace(tex, false);
        tex.update();
      },
    };
  },
};
