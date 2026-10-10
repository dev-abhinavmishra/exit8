/**
 * guide.red — the tactile guide strip still runs the full corridor
 * in its usual place, but the amber bars run red. Subtle
 * object-class anomaly.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

export const guideRed: AnomalyDef = {
  id: "guide.red",
  displayName: "Guide Strip Runs Red",
  chapter: 3,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["guide.seg.0"],
  excludes: ["guide.missing", "guide.misaligned", "guide.cross", "guide.short", "strip.grows"],
  testSeed: "test.guide.red",
  dangerous: false,
  activate(ctx) {
    const mat = ctx.world.materials.guideStrip;
    const dc = mat.diffuseColor.clone();
    // bars go from amber to arterial red — texture pattern intact
    mat.diffuseColor = new Color3(1.0, 0.22, 0.18);
    // second tell — one mid-run segment goes dead entirely
    const seg = ctx.world.registry.mesh("guide.seg.3");
    seg.setEnabled(false);
    return {
      update() {},
      cleanup() {
        seg.setEnabled(true);
        mat.diffuseColor = dc;
      },
    };
  },
};
