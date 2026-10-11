/**
 * commuter.face.blank — the commuter waits on his bench, paper in hand,
 * and his face is smooth skin. The inspector's nightmare borrowed by a
 * civilian: no eyes, no mouth, just the suggestion of a face where the
 * features should be. Moderate — it reads at memorization distance.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawFace } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const commuterFaceBlank: AnomalyDef = {
  id: "commuter.face.blank",
  displayName: "Faceless Passenger",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["commuter"],
  excludes: ["commuter.face.eyes", "commuter.face.grin", "commuter.fled", "commuter.twin"],
  testSeed: "test.commuter.face.blank",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const plate = scene.getMeshByName("commuter.fig.faceplate");
    const t = (plate?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawFace(t, "blank");
    const feats = scene.meshes.filter((m) => m.name.startsWith("commuter.fig.feat."));
    for (const m of feats) m.setEnabled(false);
    return {
      update() {},
      cleanup() {
        drawFace(t, "normal");
        for (const m of feats) m.setEnabled(true);
      },
    };
  },
};
