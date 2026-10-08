/**
 * duct.clang — somewhere far down the system, metal strikes metal:
 * one hard snap and a long dull ring carried down the duct run. It
 * never happens twice. The corridor's machinery hums; it does not
 * get struck. Sound-only.
 */
import type { AnomalyDef } from "./types";

export const ductClang: AnomalyDef = {
  id: "duct.clang",
  displayName: "Clang In The Ducts",
  chapter: 1,
  category: "sound",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [0, 100],
  requires: ["wall.left.0"],
  excludes: ["sound.announce", "vent.sigh", "vent.groan", "pa.deadair", "machine.silence"],
  testSeed: "test.duct.clang",
  dangerous: false,
  activate(ctx) {
    // sounds from the farthest grille — depth sells "far down the run"
    const vent = ctx.world.anchors.vents.reduce((a, b) => (b.z > a.z ? b : a));
    let t = ctx.rng.range(6, 14);
    return {
      update(dt) {
        if (t < 0) return;
        t -= dt;
        if (t <= 0) {
          t = -1;
          ctx.audio.playClang(vent);
        }
      },
      cleanup() {},
    };
  },
};
