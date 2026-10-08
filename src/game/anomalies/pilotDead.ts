/**
 * pilot.dead — the amber pilot lamp beside the south airlock mouth is
 * out. It's the lamp you learn to glance at before committing — an
 * empty socket. Subtle object-class anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const pilotDead: AnomalyDef = {
  id: "pilot.dead",
  displayName: "Dead Pilot Lamp",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["pilot.south"],
  excludes: [],
  testSeed: "test.pilot.dead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const lamp = ctx.world.registry.mesh("pilot.south");
    lamp.setEnabled(false);
    return {
      update() {},
      cleanup() {
        lamp.setEnabled(true);
      },
    };
  },
};
