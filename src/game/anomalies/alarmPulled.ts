import type { AnomalyDef } from "./types";

/**
 * alarm.pulled — the pull lever is down. Nobody pulled it; it hangs
 * at its tripped angle like the call already went out.
 */
export const alarmPulled: AnomalyDef = {
  id: "alarm.pulled",
  displayName: "It Was Pulled",
  chapter: 1,
  category: "spatial",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [5, 100],
  requires: ["alarm.lever"],
  excludes: ["alarm.open", "alarm.gone"],
  testSeed: "test.alarm.pulled",
  dangerous: false,
  activate(ctx) {
    const lever = ctx.world.registry.mesh("alarm.lever");
    lever.rotation.x = 0.95; // swung down on its top pivot
    return {
      update() {},
      cleanup() {
        lever.rotation.x = 0;
      },
    };
  },
};
