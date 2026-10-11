import type { AnomalyDef } from "./types";

/**
 * commuter.doze.breath — asleep on the bench, and the breath of his
 * sleeping carries the length of the corridor: a doubled inhale,
 * two draws where one belongs, loud enough to hear from the far end.
 */
export const commuterDozeBreath: AnomalyDef = {
  id: "commuter.doze.breath",
  displayName: "His Breath Carries",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [15, 80],
  requires: ["commuter"],
  excludes: [
    "commuter.startle",
    "commuter.deadsleep",
    "commuter.doze.stands",
    "commuter.doze.talks",
    "commuter.doze.mid",
  ],
  testSeed: "test.commuter.doze.breath",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "doze");
    let t = 4;
    let second = -1;
    return {
      update(dt: number) {
        t += dt;
        if (second >= 0) {
          second -= dt;
          if (second < 0) {
            // the doubled draw — the second inhale that shouldn't be there
            ctx.audio.playBreath(commuter.root.position, null, 0.7);
          }
        }
        if (t >= 5.6) {
          t = 0;
          second = 0.55;
          ctx.audio.playBreath(commuter.root.position, null, 0.85);
          ctx.audio.caption("breathing from the bench — too loud for the distance", commuter.root.position);
        }
      },
      cleanup() {},
    };
  },
};
