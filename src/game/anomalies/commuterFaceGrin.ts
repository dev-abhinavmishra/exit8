/**
 * commuter.face.grin — the smile that shouldn't be on his face. Corners
 * climbing past where a smile stops, held while he reads. Unmistakable
 * once seen, and it is only seen when you are close — which is the
 * worst part. Deep-shift character anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawFace } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const commuterFaceGrin: AnomalyDef = {
  id: "commuter.face.grin",
  displayName: "He Is Smiling",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [35, 100],
  requires: ["commuter"],
  excludes: ["commuter.face.blank", "commuter.face.eyes", "commuter.fled", "commuter.twin"],
  testSeed: "test.commuter.face.grin",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const plate = scene.getMeshByName("commuter.fig.faceplate");
    const t = (plate?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawFace(t, "grin");
    return {
      update() {},
      cleanup() {
        drawFace(t, "normal");
      },
    };
  },
};
