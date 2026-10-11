/**
 * cctv.follows — the eye follows. The corridor camera's head is fixed
 * at the floor mid-lane every other loop — tonight it pivots on its
 * bracket and tracks you end to end, the head yaw matching your z all
 * the way under the span. Unmistakable once noticed; you have to look
 * up to notice.
 */
import type { AnomalyDef } from "./types";

export const cctvFollows: AnomalyDef = {
  id: "cctv.follows",
  displayName: "The Eye Follows",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["cctv"],
  excludes: ["cctv.shy", "cctv.dead", "cctv.inward"],
  testSeed: "test.cctv.follows",
  dangerous: false,
  activate(ctx) {
    const head = ctx.scene.getTransformNodeByName("cctv.head");
    if (!head) return { update() {}, cleanup() {} };
    const baseX = head.rotation.x;
    return {
      update() {
        const p = ctx.player.position;
        const h = head.getAbsolutePosition();
        // aim the lens (+z of the head) at the player — the mount's own
        // −π/2 yaw is the offset
        const yaw = Math.atan2(p.x - h.x, p.z - h.z) + Math.PI / 2;
        head.rotation.y = Math.max(-1.15, Math.min(1.15, yaw));
        head.rotation.x = baseX * 0.6; // flattens as it leans after you
      },
      cleanup() {
        head.rotation.y = 0;
        head.rotation.x = baseX;
      },
    };
  },
};
