/**
 * cctv.dead — feeds cut. The recording pin is dark, the head hangs
 * low off its bracket like something unplugged it mid-watch, and the
 * lens reads matte. Moderate object anomaly — dead surveillance is
 * always worse than none.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef } from "./types";

export const cctvDead: AnomalyDef = {
  id: "cctv.dead",
  displayName: "Feeds Cut",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["cctv"],
  excludes: ["cctv.follows", "cctv.shy", "cctv.inward"],
  testSeed: "test.cctv.dead",
  dangerous: false,
  activate(ctx) {
    const head = ctx.scene.getTransformNodeByName("cctv.head");
    const led = ctx.scene.getMeshByName("cctv.led");
    const lens = ctx.scene.getMeshByName("cctv.lens");
    const ledMat = led?.material as StandardMaterial | null;
    const lensMat = lens?.material as StandardMaterial | null;
    const savedLed = ledMat?.emissiveColor.clone();
    const savedLens = lensMat?.specularColor.clone();
    if (head) {
      head.rotation.x = 1.05; // slumps off the bracket
      head.rotation.y = 0.35;
    }
    if (ledMat) ledMat.emissiveColor = new Color3(0, 0, 0);
    if (lensMat) lensMat.specularColor = new Color3(0, 0, 0);
    return {
      update() {},
      cleanup() {
        if (head) {
          head.rotation.x = 0.42;
          head.rotation.y = 0;
        }
        if (ledMat && savedLed) ledMat.emissiveColor = savedLed;
        if (lensMat && savedLens) lensMat.specularColor = savedLens;
      },
    };
  },
};
