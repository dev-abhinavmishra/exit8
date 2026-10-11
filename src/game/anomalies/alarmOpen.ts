import type { AnomalyDef } from "./types";

/**
 * alarm.open — the station's face plate is swung open on its hinge,
 * the works inside exposed. The lever is right there, untouched.
 */
export const alarmOpen: AnomalyDef = {
  id: "alarm.open",
  displayName: "The Face Is Open",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.95,
  progressionRange: [10, 100],
  requires: ["alarm.face"],
  excludes: ["alarm.pulled", "alarm.gone"],
  testSeed: "test.alarm.open",
  dangerous: false,
  activate(ctx) {
    const face = ctx.world.registry.get("alarm.face");
    face.rotation.y = -1.9; // swung out into the corridor
    return {
      update() {},
      cleanup() {
        face.rotation.y = 0;
      },
    };
  },
};
