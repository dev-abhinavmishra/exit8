/**
 * walker.eyeless — the inspector patrols on schedule, coat and cap and
 * cadence intact, but where his eyes should sit there are only hollow
 * sockets. Worse than faceless: the face is all there, the eyes are
 * the only thing missing.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawFace } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const walkerEyeless: AnomalyDef = {
  id: "walker.eyeless",
  displayName: "Hollow Eyes",
  chapter: 3,
  category: "spatial",
  detectability: "subtle",
  weight: 0.6,
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
  testSeed: "test.walker.eyeless",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const plate = scene.getMeshByName("ambient.walker.faceplate");
    const t = (plate?.material as { diffuseTexture?: DynamicTexture } | null)?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    drawFace(t, "eyeless");
    return {
      update() {},
      cleanup() {
        drawFace(t, "normal");
      },
    };
  },
};
