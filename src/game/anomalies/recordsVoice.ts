/**
 * records.voice — pages turn behind the records bank. Four soft,
 * irregular rustles, as if someone is working the archive on the far
 * side of the cabinets. There is no far side; the cabinets are the
 * wall. Sound-only, subtle.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const recordsVoice: AnomalyDef = {
  id: "records.voice",
  displayName: "Someone In The Archive",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.65,
  progressionRange: [10, 100],
  requires: ["wall.left.2"],
  excludes: ["machine.silence", "pa.deadair"],
  testSeed: "test.records.voice",
  dangerous: false,
  activate(ctx) {
    // mid-bank, ear height, just inside the cabinet face
    const pos = new Vector3(-1.72, 1.4, ctx.rng.range(14, 28));
    let t = ctx.rng.range(8, 18);
    return {
      update(dt) {
        if (t < 0) return;
        t -= dt;
        if (t <= 0) {
          t = -1;
          ctx.audio.playRustle(pos);
        }
      },
      cleanup() {},
    };
  },
};
