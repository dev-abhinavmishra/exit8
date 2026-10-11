/**
 * commuter.face.eyes — the face keeps its shape — brow, nose, jaw — but
 * where the eyes should sit there are only sockets, dark set slightly
 * too deep. He reads his paper all the same. Moderate character-class
 * anomaly: subtler than the full erasure, colder for it.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawFace } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const commuterFaceEyes: AnomalyDef = {
  id: "commuter.face.eyes",
  displayName: "Hollow Eyes",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["commuter"],
  excludes: ["commuter.face.blank", "commuter.face.grin", "commuter.fled", "commuter.twin"],
  testSeed: "test.commuter.face.eyes",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const plate = scene.getMeshByName("commuter.fig.faceplate");
    const t = (plate?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawFace(t, "eyeless");
    // relief stays — the horror is that everything else is right
    return {
      update() {},
      cleanup() {
        drawFace(t, "normal");
      },
    };
  },
};
