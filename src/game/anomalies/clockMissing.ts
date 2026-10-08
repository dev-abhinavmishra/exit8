/**
 * clock.missing — the master clock is simply gone. Face, rim, hands —
 * a bare patch of wall above the records cabinets where Loop 7's only
 * instrument used to be. Absences are the quietest lie the corridor
 * tells.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const clockMissing: AnomalyDef = {
  id: "clock.missing",
  displayName: "No Clock At All",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["clock.face", "clock.hour.pivot", "clock.minute.pivot"],
  excludes: ["clock"],
  testSeed: "test.clock.missing",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // hide the whole clock root — face, rim, pin, both hands
    const root = ctx.world.registry.get("clock.face").parent as TransformNode;
    root.setEnabled(false);
    return {
      update() {},
      cleanup() {
        root.setEnabled(true);
      },
    };
  },
};
