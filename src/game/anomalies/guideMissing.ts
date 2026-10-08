/**
 * guide.missing — a run of the tactile guide strip is simply absent.
 * The amber channel every inspector follows breaks for six metres and
 * resumes like nothing happened. Subtle from mid-corridor, obvious
 * underfoot.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const guideMissing: AnomalyDef = {
  id: "guide.missing",
  displayName: "The Line Breaks",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
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
  excludes: [],
  testSeed: "test.guide.missing",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // one or two adjacent segments gone, seeded — never the first or
    // last, the break has to sit inside a continuous run
    const count = ctx.rng.int(1, 3);
    const start = ctx.rng.int(1, 8 - count);
    const hidden: { setEnabled(v: boolean): void }[] = [];
    for (let i = start; i < start + count; i++) {
      hidden.push(ctx.world.registry.mesh(`guide.seg.${i}`));
    }
    for (const m of hidden) m.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const m of hidden) m.setEnabled(true);
      },
    };
  },
};
