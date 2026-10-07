/**
 * footsteps.ahead — the corridor answers. Each of your footsteps is
 * repeated once, ~0.9 s later, from five meters in FRONT of you. Where
 * footsteps.extra trails behind, this one is already where you're going.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const footstepsAhead: AnomalyDef = {
  id: "footsteps.ahead",
  displayName: "Corridor Answers",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["floor"],
  excludes: ["sound.steps"],
  testSeed: "test.footsteps.ahead",
  dangerous: false,
  activate(ctx) {
    const DELAY = 0.9;
    const AHEAD = 5.5;
    const queue: { at: number; pos: Vector3; i: number }[] = [];
    const unsub = ctx.player.onFootstep((pos, intensity) => {
      // echo lands ahead of the player's facing
      const fwd = ctx.player.camera.getDirection(Vector3.Forward());
      const at = pos.clone().addInPlace(fwd.scale(AHEAD));
      queue.push({ at: DELAY, pos: at, i: intensity });
    });
    return {
      update(dt) {
        for (const q of queue) q.at -= dt;
        while (queue.length > 0 && queue[0]!.at <= 0) {
          const q = queue.shift()!;
          ctx.audio.playFootstep(q.pos, q.i * 0.8, true);
        }
      },
      cleanup() {
        unsub();
        queue.length = 0;
      },
    };
  },
};
