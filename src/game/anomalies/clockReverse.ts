/**
 * clock.reverse — the master clock's hands sweep counter-clockwise at ~8×
 * and its mechanical tick doubles. Moderate: motion is obvious once seen,
 * subtle enough to walk past.
 */
import type { AnomalyDef } from "./types";

export const clockReverse: AnomalyDef = {
  id: "clock.reverse",
  displayName: "Counterclockwise Clock",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["clock.hour.pivot", "clock.minute.pivot", "clock.face"],
  excludes: ["clock"],
  testSeed: "test.clock.reverse",
  dangerous: false,
  activate(ctx) {
    const hour = ctx.world.clock.hourPivot;
    const minute = ctx.world.clock.minutePivot;
    const speed = ctx.rng.range(6.5, 9.5);
    const tick = ctx.audio.createTicker("clock.tick");
    tick.setPosition(ctx.world.anchors.clock);
    tick.setRate(2.2); // doubled cadence vs baseline 1.1/s
    tick.start();
    let t = 0;
    return {
      update(dt) {
        t += dt;
        minute.rotation.z = -t * speed * 0.45;
        hour.rotation.z = -t * speed * 0.045;
      },
      cleanup() {
        tick.stop();
        minute.rotation.z = 0;
        hour.rotation.z = 0;
      },
    };
  },
};
