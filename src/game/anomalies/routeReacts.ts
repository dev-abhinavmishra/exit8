/**
 * route.reacts — the corridor repeats a sound the player made. Their
 * last several footsteps play back at the exact cadence they took them,
 * from exactly where they took them — but only once the player has
 * stopped walking for a few seconds. In the quiet, their own route
 * walks itself. Moderate.
 */
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const IDLE_S = 2.6;
const MIN_STEPS = 3;
const MAX_STEPS = 6;

export const routeReacts: AnomalyDef = {
  id: "route.reacts",
  displayName: "The Route Repeats You",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["floor"],
  excludes: ["sound.steps"],
  testSeed: "test.route.reacts",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // record the player's own steps (sim-time offsets + positions); on
    // 2.6s of stillness the recorded run plays itself back once
    const steps: { at: number; pos: Vector3; i: number }[] = [];
    let t = 0;
    let lastStepT = 0;
    let playing = false;
    let playIdx = 0;
    const unsub = ctx.player.onFootstep((pos, intensity) => {
      lastStepT = t;
      if (!playing) steps.push({ at: t, pos: pos.clone(), i: intensity });
      if (steps.length > MAX_STEPS) steps.shift();
    });
    return {
      update(dt) {
        t += dt;
        if (!playing && steps.length >= MIN_STEPS && t - lastStepT > IDLE_S) {
          playing = true;
          playIdx = 0;
        }
        if (playing) {
          const base = steps[0]!.at;
          const elapsed = t - lastStepT - IDLE_S;
          while (playIdx < steps.length && steps[playIdx]!.at - base <= elapsed) {
            const s = steps[playIdx]!;
            ctx.audio.playFootstep(s.pos, s.i * 0.85, true);
            playIdx++;
          }
          if (playIdx >= steps.length) {
            steps.length = 0;
            playing = false;
          }
        }
      },
      cleanup() {
        unsub();
      },
    };
  },
};
