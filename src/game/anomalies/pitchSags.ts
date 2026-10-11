/**
 * pitch.sags — the junction machinery thrum drifts flat over the loop:
 * a slow semitone-class sag that never resolves. Nothing flickers,
 * nothing moves — the corridor's one constant sound slides out of tune
 * under you. Subtle because it takes most of a loop to fully land.
 */
import type { AnomalyDef } from "./types";

export const pitchSags: AnomalyDef = {
  id: "pitch.sags",
  displayName: "The Hum Sags",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [10, 100],
  requires: ["wall.left.0"],
  excludes: ["machine.silence", "machine.rattle", "corridor.breathes"],
  testSeed: "test.pitch.sags",
  dangerous: false,
  activate(ctx) {
    let sag = 1;
    const floor = 0.9 + ctx.rng.range(-0.02, 0.02); // ~a semitone flat
    const drift = ctx.rng.range(80, 110); // seconds to fully sag
    let t = 0;
    ctx.audio.setMachinePitch(() => sag);
    return {
      update(dt) {
        if (t < drift) {
          t = Math.min(drift, t + dt);
          const k = t / drift;
          sag = 1 + (floor - 1) * k * k; // ease-in so the slide creeps
        }
      },
      cleanup() {
        ctx.audio.setMachinePitch(null);
      },
    };
  },
};
