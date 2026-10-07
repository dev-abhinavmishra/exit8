/**
 * guide.misaligned — the tactile strip kinks mid-run. A handful of
 * adjacent segments yaw a few degrees out of true, so the amber line
 * that ran straight every loop since Loop 1 now wanders. Reads from
 * anywhere in the corridor once you're looking down.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const guideMisaligned: AnomalyDef = {
  id: "guide.misaligned",
  displayName: "The Line Bends",
  chapter: 2,
  category: "object",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: [
    "guide.seg.0",
    "guide.seg.1",
    "guide.seg.2",
    "guide.seg.3",
    "guide.seg.4",
    "guide.seg.5",
    "guide.seg.6",
    "guide.seg.7",
  ],
  excludes: ["guide.missing"],
  testSeed: "test.guide.misaligned",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // 3 adjacent segments yawed with alternating sign — an S-bend that
    // joins back onto the straight run at both ends
    const start = ctx.rng.int(1, 5);
    const yaw = ctx.rng.range(0.09, 0.14);
    const bent: { mesh: { rotation: { y: number } }; orig: number }[] = [];
    for (let i = start; i < start + 3; i++) {
      const m = ctx.world.registry.mesh(`guide.seg.${i}`);
      bent.push({ mesh: m, orig: m.rotation.y });
      m.rotation.y = (i % 2 === 0 ? yaw : -yaw) * (i === start + 1 ? 1.4 : 1);
    }
    return {
      update() {},
      cleanup() {
        for (const b of bent) b.mesh.rotation.y = b.orig;
      },
    };
  },
};
