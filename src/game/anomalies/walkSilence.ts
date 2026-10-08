/**
 * walk.silence — your own footfalls stop answering you. For a stretch
 * mid-loop the terrazzo swallows every step you take: you watch your
 * stride land and nothing comes back. You only notice if you're
 * listening for yourself. Subtle, and it feels like the corridor's
 * fault rather than yours.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const walkSilence: AnomalyDef = {
  id: "walk.silence",
  displayName: "Steps Swallowed",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [20, 100],
  requires: ["light.zone.gallery"],
  excludes: ["echo.steps", "footsteps.extra", "machine.silence", "voice.near"],
  testSeed: "test.walk.silence",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // fire after the player has walked enough to have the cadence in
    // their ears, then hold the hush for a seeded window
    const delay = ctx.rng.range(6, 14);
    const hold = ctx.rng.range(9, 16);
    let t = 0;
    let fired = false;
    return {
      update(dt) {
        if (fired) return;
        t += dt;
        if (t >= delay) {
          fired = true;
          ctx.audio.muteBusFor("footsteps", hold);
          ctx.audio.caption("your steps stop answering", null);
        }
      },
      cleanup() {},
    };
  },
};
