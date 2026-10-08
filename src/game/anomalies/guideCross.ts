/**
 * guide.cross — the amber tactile guide strip crosses the corridor.
 * South of the junction it still runs right-of-centre; north of it the
 * line marches down the LEFT walkway instead. It never crossed in any
 * previous loop.
 */
import type { AnomalyDef } from "./types";

const SEGS = 8;
const RIGHT_X = 0.72;
const LEFT_X = -0.72;
const CROSS_AT = 4; // segments 0-3 right, 4-7 left

export const guideCross: AnomalyDef = {
  id: "guide.cross",
  displayName: "Crossed Guide",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [15, 100],
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
  excludes: ["guide"],
  testSeed: "test.guide.cross",
  dangerous: false,
  activate(ctx) {
    const homes: number[] = [];
    for (let i = 0; i < SEGS; i++) {
      const seg = ctx.world.registry.get(`guide.seg.${i}`) as { position: { x: number } };
      homes.push(seg.position.x);
      seg.position.x = i < CROSS_AT ? RIGHT_X : LEFT_X;
    }
    return {
      update() {},
      cleanup() {
        for (let i = 0; i < SEGS; i++) {
          (ctx.world.registry.get(`guide.seg.${i}`) as { position: { x: number } }).position.x = homes[i]!;
        }
      },
    };
  },
};
