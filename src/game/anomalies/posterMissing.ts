/**
 * poster.missing — the middle notice-board poster is gone, leaving a bare
 * stretch of wall. Subtle count-and-placement bait.
 */
import type { AnomalyDef } from "./types";

export const posterMissing: AnomalyDef = {
  id: "poster.missing",
  displayName: "Missing Poster",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["poster.1"],
  excludes: ["wall.left.poster"],
  testSeed: "test.poster.missing",
  dangerous: false,
  activate(ctx) {
    const p = ctx.world.registry.mesh("poster.1");
    p.isVisible = false;
    return {
      update() {},
      cleanup() {
        p.isVisible = true;
      },
    };
  },
};
