/**
 * ads.dead — every lightbox is out. Three dark frames on the east wall
 * where the only warm thing in this stretch used to burn.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const adsDead: AnomalyDef = {
  id: "ads.dead",
  displayName: "Slots Unpaid",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["ads.face.0", "ads.face.1", "ads.face.2"],
  excludes: ["ads.breath"],
  testSeed: "test.ads.dead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const mats = [0, 1, 2].map(
      (i) => ctx.world.registry.mesh(`ads.face.${i}`).material as StandardMaterial,
    );
    const saved = mats.map((m) => m.emissiveColor.clone());
    mats.forEach((m) => (m.emissiveColor = new Color3(0.015, 0.015, 0.015)));
    return {
      update() {},
      cleanup() {
        mats.forEach((m, i) => (m.emissiveColor = saved[i]!));
      },
    };
  },
};
