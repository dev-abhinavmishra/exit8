/**
 * lobby.voices — voices behind the sealed lift doors. A muffled back-
 * and-forth seeps through the lobby face: a sigh, a rustle of fabric,
 * sometimes a second presence answering. The shaft should be empty and
 * the car should be somewhere else. Subtle — audible only near the lift.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const LIFT = new Vector3(1.42, 1.4, 49.5);
const HEAR_D2 = 64; // ~8 m

export const lobbyVoices: AnomalyDef = {
  id: "lobby.voices",
  displayName: "Voices in the Shaft",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 1,
  progressionRange: [10, 100],
  requires: ["wall.right.2b"],
  excludes: ["lift.arrives", "lift.car", "clinic.staffed", "lights.blackout"],
  testSeed: "test.lobby.voices",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    let t = 0;
    let next = ctx.rng.range(4, 9);
    let told = false;
    return {
      update(dt) {
        const p = ctx.player.position;
        const d2 = (p.x - LIFT.x) ** 2 + (p.z - LIFT.z) ** 2;
        if (!told && d2 < HEAR_D2) {
          told = true;
          ctx.audio.caption("voices behind the lift doors", LIFT);
        }
        t += dt;
        if (t >= next) {
          t = 0;
          next = ctx.rng.range(3.5, 8.5);
          // a sigh answers a rustle, or the rustle answers a sigh —
          // never the same twice in a row
          if (ctx.rng.chance(0.55)) ctx.audio.playSigh(LIFT);
          else ctx.audio.playRustle(LIFT);
        }
      },
      cleanup() {},
    };
  },
};
