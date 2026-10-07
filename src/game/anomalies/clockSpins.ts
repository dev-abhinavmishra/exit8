/**
 * clock.spins — the master clock's hands whirl forward at full speed, a
 * frightened mechanical blur. Unmistakable in motion; the dial is loud
 * about it with a doubled tick.
 */
import type { AnomalyDef } from "./types";

export const clockSpins: AnomalyDef = {
  id: "clock.spins",
  displayName: "Runaway Clock",
  chapter: 2,
  category: "object",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["clock.hour.pivot", "clock.minute.pivot", "clock.face"],
  excludes: ["clock"],
  testSeed: "test.clock.spins",
  dangerous: false,
  activate(ctx) {
    const hour = ctx.world.clock.hourPivot;
    const minute = ctx.world.clock.minutePivot;
    const tick = ctx.audio.createTicker("clock.spintick");
    tick.setPosition(ctx.world.anchors.clock);
    tick.setRate(3.6);
    tick.start();
    let t = 0;
    return {
      update(dt) {
        t += dt;
        // both hands race forward; minute is a blur, hour visibly winds
        minute.rotation.z = t * 14;
        hour.rotation.z = t * 1.1;
      },
      cleanup() {
        tick.stop();
        minute.rotation.z = 0;
        hour.rotation.z = 0;
      },
    };
  },
};
