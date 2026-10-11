import type { AnomalyDef } from "./types";

/**
 * commuter.steps.off — he walks out at his usual unhurried pace, but
 * his footfalls run near twice his stride — too many steps for the
 * legs you see moving. The gait and its sound disagree.
 */
export const commuterStepsOff: AnomalyDef = {
  id: "commuter.steps.off",
  displayName: "Too Many Steps",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [40, 100],
  requires: ["commuter", "al.south.cap"],
  excludes: [
    "commuter.stays",
    "commuter.returns",
    "commuter.north",
    "commuter.fled",
    "commuter.midflee",
    "commuter.steps.linger",
    "commuter.steps.ahead",
  ],
  testSeed: "test.commuter.steps.off",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 15 });
    const prev = commuter.onStep;
    // mute the honest stride; the anomaly owns the footstep clock now
    commuter.onStep = undefined;
    let stepT = 0;
    return {
      update(dt: number) {
        if (commuter.departState() !== "walk") return;
        stepT += dt;
        if (stepT >= 0.31) {
          stepT = 0;
          ctx.audio.playFootstep(commuter.root.position, 0.45);
        }
      },
      cleanup() {
        commuter.onStep = prev;
      },
    };
  },
};
