/**
 * cctv.inward — it watches the wall. The head has swung a half-turn on
 * its bracket and stares point-blank into the tile it hangs off of —
 * recording nothing, or recording the wall, or watching whatever is
 * behind it. Subtle spatial anomaly — most wrong when you know where
 * it should aim.
 */
import type { AnomalyDef } from "./types";

export const cctvInward: AnomalyDef = {
  id: "cctv.inward",
  displayName: "It Watches The Wall",
  chapter: 1,
  category: "spatial",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["cctv"],
  excludes: ["cctv.follows", "cctv.shy", "cctv.dead"],
  testSeed: "test.cctv.inward",
  dangerous: false,
  activate(ctx) {
    const head = ctx.scene.getTransformNodeByName("cctv.head");
    if (!head) return { update() {}, cleanup() {} };
    head.rotation.y = Math.PI - 0.35; // into the tile, slightly off-axis
    head.rotation.x = -0.15;
    return {
      update() {},
      cleanup() {
        head.rotation.y = 0;
        head.rotation.x = 0.42;
      },
    };
  },
};
