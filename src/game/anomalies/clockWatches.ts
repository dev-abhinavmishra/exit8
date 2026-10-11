import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.watches — both hands of the hanging clock bear on you,
 * always. Wherever you stand the face reads your bearing like a
 * compass — the clock isn't telling time tonight.
 */
export const clockWatches: AnomalyDef = {
  id: "clock.watches",
  displayName: "It Knows Where You Stand",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [18, 100],
  requires: ["clock.hour.pivot", "clock.minute.pivot"],
  excludes: ["clock.stopped", "clock.spins", "clock.reverse", "clock.gone", "clock.fallen"],
  testSeed: "test.clock.watches",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const hour = ctx.world.registry.get("clock.hour.pivot");
    const minute = ctx.world.registry.get("clock.minute.pivot");
    const h0 = hour.rotation.z;
    const m0 = minute.rotation.z;
    return {
      update() {
        const p = ctx.player.position;
        // bearing to the player in the face plane (z horizontal, y
        // vertical); rotation.z sweeps clockwise from 12 o'clock
        const dz = p.z - 24.0;
        const dy = p.y - 2.6;
        const bearing = Math.atan2(dz, dy);
        hour.rotation.z = bearing;
        minute.rotation.z = bearing;
      },
      cleanup() {
        hour.rotation.z = h0;
        minute.rotation.z = m0;
      },
    };
  },
};
