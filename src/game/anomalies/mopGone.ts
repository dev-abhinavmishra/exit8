/**
 * mop.gone — the mop bucket that always leans by the west wall in the
 * last stretch is simply not there. Subtle object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const mopGone: AnomalyDef = {
  id: "mop.gone",
  displayName: "Mop Bucket Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["mop.bucket"],
  excludes: ["bucket.tipped"],
  testSeed: "test.mop.gone",
  dangerous: false,
  activate(ctx) {
    const node = ctx.world.registry.get("mop.bucket");
    node.setEnabled(false);
    return {
      update() {},
      cleanup() {
        node.setEnabled(true);
      },
    };
  },
};
