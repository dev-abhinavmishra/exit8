/**
 * commuter.paper.blank — his folded paper still reads like a paper
 * at two metres, but the sheet is blank: no headline bar, no columns.
 * Subtle.
 */
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterPaperBlank: AnomalyDef = {
  id: "commuter.paper.blank",
  displayName: "Blank Paper",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["commuter.paper"],
  excludes: ["commuter.gone.paper"],
  testSeed: "test.commuter.paper.blank",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const paper = ctx.world.registry.mesh("commuter.paper");
    const tex = (paper?.material as StandardMaterial | undefined)?.diffuseTexture as
      DynamicTexture | undefined;
    if (!tex) return { update() {}, cleanup() {} };
    const paint = (blank: boolean) => {
      const pc = tex.getContext();
      pc.fillStyle = "#b9b4a6";
      pc.fillRect(0, 0, 128, 96);
      if (!blank) {
        pc.fillStyle = "#4a463c";
        pc.fillRect(8, 8, 112, 12);
        pc.fillStyle = "#6f6a5c";
        for (let i = 0; i < 6; i++) {
          pc.fillRect(8, 28 + i * 10, 52, 4);
          pc.fillRect(68, 28 + i * 10, 52, 4);
        }
      }
      tex.update();
    };
    paint(true);
    return {
      update() {},
      cleanup() {
        paint(false);
      },
    };
  },
};
