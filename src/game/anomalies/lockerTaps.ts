/**
 * locker.taps — one locker door in the run trembles every few seconds
 * while something inside knocks: three soft thuds and a rattle of the
 * latch, localized to that one locker. The doors never open — that's
 * locker.ajar's job; this one stays shut and wants out. Moderate.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const LOCKER_X = -1.65;

export const lockerTaps: AnomalyDef = {
  id: "locker.taps",
  displayName: "Knocking From a Locker",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [20, 100],
  requires: ["lockers"],
  excludes: ["locker.ajar", "lockers.all"],
  testSeed: "test.locker.taps",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const i = ctx.rng.int(0, 4);
    const pivot = ctx.world.registry.get(`lockers.door${i}.pivot`);
    const pos = new Vector3(LOCKER_X, 1.0, 48 - 0.675 + i * 0.45);
    let next = ctx.rng.range(6, 14);
    let t = 0;
    let shake = 1; // >0 means idle
    return {
      update(dt) {
        t += dt;
        if (t >= next) {
          next = t + ctx.rng.range(9, 18);
          ctx.audio.playRattle(pos);
          shake = 0;
        }
        if (pivot) {
          if (shake < 0.6) {
            shake += dt;
            pivot.rotation.y = Math.sin(shake * 55) * 0.018 * Math.max(0, 1 - shake * 2);
          } else if (pivot.rotation.y !== 0) {
            pivot.rotation.y = 0;
          }
        }
      },
      cleanup() {
        if (pivot) pivot.rotation.y = 0;
      },
    };
  },
};
