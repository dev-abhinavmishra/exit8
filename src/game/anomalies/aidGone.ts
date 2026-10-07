/**
 * aid.gone — the first-aid cabinet on the east wall before the lift
 * lobby is not there. The pale wall behind it is blank where a white
 * box with a green cross used to be. Pure memorization.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const aidGone: AnomalyDef = {
  id: "aid.gone",
  displayName: "Missing First Aid Cabinet",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["aid.cabinet"],
  excludes: [],
  testSeed: "test.aid.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const unit = world.registry.get("aid.cabinet");
    unit.setEnabled(false);
    return {
      update() {},
      cleanup() {
        unit.setEnabled(true);
      },
    };
  },
};
