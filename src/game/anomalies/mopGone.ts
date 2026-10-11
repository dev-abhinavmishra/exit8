/**
 * mop.gone — the mop bucket that always leans by the west wall in the
 * last stretch is simply not there; the run of wall it dressed is bare.
 * Subtle — an absent prop where a habit expected one.
 */
import type { AnomalyDef } from "./types";

export const mopGone: AnomalyDef = {
  id: "mop.gone",
  displayName: "Mop Bucket Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["mop.bucket"],
  excludes: ["bucket.tipped"],
  testSeed: "test.mop.gone",
  dangerous: false,
  activate(ctx) {
    const mop = ctx.world.registry.get("mop.bucket");
    if (!mop) return { update() {}, cleanup() {} };
    mop.setEnabled(false);
    return {
      update() {},
      cleanup() {
        mop.setEnabled(true);
      },
    };
  },
};
