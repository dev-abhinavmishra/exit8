/**
 * machine.rattle — the junction machine over-revs: a fast low rattle from
 * the machinery cabinet at z≈47. Moderate — audible two zones early.
 */
import type { AnomalyDef } from "./types";

export const machineRattle: AnomalyDef = {
  id: "machine.rattle",
  displayName: "Over-revved Junction Machine",
  chapter: 1,
  category: "sound",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["junction.machine"],
  excludes: ["sound.machinery"],
  testSeed: "test.machine.rattle",
  dangerous: false,
  activate(ctx) {
    const rattle = ctx.audio.createTicker("machine.rattle");
    rattle.setPosition(ctx.world.anchors.junctionMachine);
    rattle.setRate(3.4);
    rattle.start();
    return {
      update() {},
      cleanup() {
        rattle.stop();
      },
    };
  },
};
