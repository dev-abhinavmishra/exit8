/**
 * guide.short — the tactile guide strip still runs south, but it
 * stops metres short of the inspection-point doors. The last two
 * segments are simply not there. Moderate spatial-class anomaly.
 */
import type { AnomalyDef } from "./types";

const TAIL_SEGMENTS = ["guide.seg.6", "guide.seg.7"];

export const guideShort: AnomalyDef = {
  id: "guide.short",
  displayName: "Guide Strip Ends Early",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["guide.seg.6", "guide.seg.7"],
  excludes: ["guide.missing", "guide.misaligned", "guide.cross", "strip.grows"],
  testSeed: "test.guide.short",
  dangerous: false,
  activate(ctx) {
    const hidden = TAIL_SEGMENTS.map((n) => ctx.world.registry.mesh(n));
    for (const m of hidden) m.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const m of hidden) m.setEnabled(true);
      },
    };
  },
};
