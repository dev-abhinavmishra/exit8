/**
 * memory.persist — one scatter detail you "logged" last loop is back at
 * the exact same spot while everything else re-dressed. The corridor is
 * never pixel-identical — except this. Subtle; rewards memorization of
 * the harmless clutter.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const memoryPersist: AnomalyDef = {
  id: "memory.persist",
  displayName: "Detail That Stayed",
  chapter: 2,
  category: "systemic",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [0, 100],
  requires: ["dress.scatter"],
  excludes: ["scatter"],
  testSeed: "test.memory.persist",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.scatter.repeatLast(ctx.rng.int(0, 6));
    return {
      update() {
        // static swap — nothing animates
      },
      cleanup() {
        // next refresh() re-dresses normally; the variant's recorded
        // spot simply joins the pool again
      },
    };
  },
};
