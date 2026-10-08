/**
 * drain.gurgles — a floor drain glugs back. Every so often a wet gulp
 * rolls up out of one of the corridor's drain grates, like the pipe
 * swallowed something it shouldn't have. Subtle sound-class; you only
 * file it if you can place it.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef, AnomalyInstance } from "./types";

// grate spots from the dressing pass — west-east pairs at fixed z
const DRAIN_SPOTS: [number, number][] = [
  [-1, 2.6],
  [1, 2.6],
  [-1, 27],
  [1, 41],
  [-1, 53],
  [1, 53],
];

export const drainGurgles: AnomalyDef = {
  id: "drain.gurgles",
  displayName: "The Drain Swallows",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: [],
  excludes: ["floor.flood", "ceiling.weeps", "machine.silence", "horn.crackle"],
  testSeed: "test.drain.gurgles",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { rng } = ctx;
    const C = LAYOUT.corridor;
    const [sx, dz] = rng.pick(DRAIN_SPOTS);
    const pos = new Vector3(sx * (C.xHalf - 0.28), 0.05, dz);
    let next = rng.range(8, 18);
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (t >= next) {
          next = t + rng.range(16, 34);
          ctx.audio.playBreath(pos, "the drain gurgles");
        }
      },
      cleanup() {},
    };
  },
};
