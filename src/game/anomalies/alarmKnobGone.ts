import type { AnomalyDef } from "./types";

/**
 * alarm.knob.gone — the pull knob is gone, the lever stem left bare.
 * Subtle: the little red detail at the bottom of the lever is missing.
 */
export const alarmKnobGone: AnomalyDef = {
  id: "alarm.knob.gone",
  displayName: "No Knob To Pull",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [5, 100],
  requires: ["alarm.knob"],
  excludes: ["alarm.gone"],
  testSeed: "test.alarm.knob.gone",
  dangerous: false,
  activate(ctx) {
    const knob = ctx.world.registry.mesh("alarm.knob");
    knob.setEnabled(false);
    return {
      update() {},
      cleanup() {
        knob.setEnabled(true);
      },
    };
  },
};
