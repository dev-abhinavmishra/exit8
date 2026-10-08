/**
 * walker.faceless — the other inspector walks his usual route, at his
 * usual cadence, but his face is smooth skin. No eyes, no mouth —
 * just the cap's shadow where a face should be. Moderate spatial-class
 * anomaly.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawFace } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const walkerFaceless: AnomalyDef = {
  id: "walker.faceless",
  displayName: "Faceless Inspector",
  chapter: 3,
  category: "spatial",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [40, 100],
  requires: ["ambient.walker"],
  excludes: ["walker", "walker.absent", "walker.stare", "walker.backwards", "walker.crowd"],
  testSeed: "test.walker.faceless",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const plate = scene.getMeshByName("ambient.walker.faceplate");
    const t = (plate?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawFace(t, "blank");
    return {
      update() {},
      cleanup() {
        drawFace(t, "normal");
      },
    };
  },
};
