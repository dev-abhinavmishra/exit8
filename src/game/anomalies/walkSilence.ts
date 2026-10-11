/**
 * walk.silence — the inspector keeps his cadence but his steps stop
 * sounding. You see him cross the hall on his patrol and the terrazzo
 * answers nothing. Subtle: only audible evidence, and only if you were
 * already tracking him by ear. Wrapping onStep to a no-op is enough —
 * his gait, timing and route stay baseline.
 */
import type { AnomalyDef } from "./types";

export const walkSilence: AnomalyDef = {
  id: "walk.silence",
  displayName: "Steps Swallowed",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [10, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker.absent",
    "walker.crowd",
    "walker.follow",
    "walker.charge",
    "footsteps.extra",
    "echo.steps",
  ],
  testSeed: "test.walk.silence",
  dangerous: false,
  activate(ctx) {
    const walker = ctx.world.ambientWalker;
    const prev = walker.onStep;
    walker.onStep = () => {};
    return {
      update() {},
      cleanup() {
        // restore the app's wiring, not a snapshot — another anomaly may
        // have layered its own handler on top of ours meanwhile
        walker.onStep = prev ?? ((pos) => ctx.audio.playFootstep(pos, 0.5));
      },
    };
  },
};
