/**
 * walker.smile — the other inspector walks his route, and the flat,
 * tired face he always wears has learned to smile. The grin climbs
 * past where a mouth ends and shows teeth. Subtle-moderate spatial
 * anomaly: you have to get close enough to read the repaint.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawFace } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const walkerSmile: AnomalyDef = {
  id: "walker.smile",
  displayName: "The Grin",
  chapter: 3,
  category: "spatial",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [45, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker",
    "walker.absent",
    "walker.stare",
    "walker.backwards",
    "walker.crowd",
    "walker.faceless",
  ],
  testSeed: "test.walker.smile",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const plate = scene.getMeshByName("ambient.walker.faceplate");
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
