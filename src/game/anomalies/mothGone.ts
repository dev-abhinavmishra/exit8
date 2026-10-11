import type { AnomalyDef } from "./types";

/**
 * moth.gone — the moth isn't at its lamp tonight. The lit under-face
 * of the gallery troffer is bare. Subtle: a learned absence.
 */
export const mothGone: AnomalyDef = {
  id: "moth.gone",
  displayName: "No Moth Tonight",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["moth"],
  excludes: ["moth.dead", "moth.swarm", "moth.orbit", "moth.huge"],
  testSeed: "test.moth.gone",
  dangerous: false,
  activate(ctx) {
    const moth = ctx.scene.getTransformNodeByName("moth");
    if (!moth) return { update() {}, cleanup() {} };
    moth.setEnabled(false);
    return {
      update() {},
      cleanup() {
        moth.setEnabled(true);
      },
    };
  },
};
