/**
 * panel.open — the breaker panel on the west wall hangs open on its
 * hinge, showing the dark bus inside. It was shut. Subtle object-class
 * anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const panelOpen: AnomalyDef = {
  id: "panel.open",
  displayName: "Breaker Panel Open",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["elec.panel.door"],
  excludes: [],
  testSeed: "test.panel.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const door = ctx.world.registry.get("elec.panel.door");
    const rot = door.rotation.clone();
    door.rotation.y = 0.95;
    return {
      update() {},
      cleanup() {
        door.rotation.copyFrom(rot);
      },
    };
  },
};
