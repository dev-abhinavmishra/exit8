import type { AnomalyDef } from "./types";

/**
 * ceil.ajar — the ceiling access panel is slid half off its seat: a
 * dark slit along the tee grid where a flush plate should sit.
 * Subtle-moderate, overhead.
 */
export const ceilAjar: AnomalyDef = {
  id: "ceil.ajar",
  displayName: "The Panel Is Slid",
  chapter: 1,
  category: "spatial",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [5, 100],
  requires: ["ceil.panel"],
  excludes: ["ceil.open", "ceil.fallen", "ceil.cord", "ceil.lit"],
  testSeed: "test.ceil.ajar",
  dangerous: false,
  activate(ctx) {
    const panel = ctx.scene.getTransformNodeByName("ceil.panel");
    if (!panel) return { update() {}, cleanup() {} };
    panel.position.z = 0.38; // slid south — north half of the void open
    return {
      update() {},
      cleanup() {
        panel.position.z = 0;
      },
    };
  },
};
