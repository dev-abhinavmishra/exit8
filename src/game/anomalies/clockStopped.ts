/**
 * clock.stopped — the corridor clock has stopped. Both hands sit frozen
 * at 04:12 — the exact minute the NOTICE sign says inspections resumed.
 * The quietest of the clock family: nothing wrong you can point at,
 * just a timepiece that gave up. Subtle.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const clockStopped: AnomalyDef = {
  id: "clock.stopped",
  displayName: "Stopped at 04:12",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.75,
  progressionRange: [0, 100],
  requires: ["clock.face", "clock.hour.pivot", "clock.minute.pivot"],
  excludes: ["clock.reverse", "clock.spins", "clock.missing"],
  testSeed: "test.clock.stopped",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const hour = ctx.world.clock.hourPivot;
    const minute = ctx.world.clock.minutePivot;
    // second tell — the whole face hangs crooked on its screws
    const faceMesh = ctx.world.registry.get("clock.face");
    const faceRz = faceMesh.rotation.z;
    faceMesh.rotation.z = faceRz + 0.045;
    // hands are drawn pointing at 12 with rotation.z sweeping clockwise;
    // 04:12 → minute hand 12/60 of a turn, hour hand (4 + 12/60)/12
    const minuteZ = -(12 / 60) * Math.PI * 2;
    const hourZ = -((4 + 12 / 60) / 12) * Math.PI * 2;
    return {
      update() {
        minute.rotation.z = minuteZ;
        hour.rotation.z = hourZ;
      },
      cleanup() {
        faceMesh.rotation.z = faceRz;
        minute.rotation.z = 0;
        hour.rotation.z = 0;
      },
    };
  },
};
