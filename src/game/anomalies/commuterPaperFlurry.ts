import type { AnomalyDef } from "./types";

/**
 * commuter.paper.flurry — he never leaves the bench, and he never
 * stops reading: a page rustles every second and a half, each with
 * the same small flick of his arm — a speed no one reads at.
 */
export const commuterPaperFlurry: AnomalyDef = {
  id: "commuter.paper.flurry",
  displayName: "Speed-Reading",
  chapter: 1,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 70],
  requires: ["commuter", "commuter.paper"],
  excludes: ["commuter.stays", "commuter.returns", "commuter.north", "commuter.fled", "commuter.midflee"],
  testSeed: "test.commuter.paper.flurry",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart(null); // the flurry only reads if he stays
    let t = 0;
    let flickT = 0;
    return {
      update(dt: number) {
        t += dt;
        if (flickT > 0) {
          flickT -= dt;
          if (flickT <= 0) commuter.fig.arms[1]!.rotation.x = -0.7;
        }
        if (t >= 1.4) {
          t = 0;
          flickT = 0.22;
          commuter.fig.arms[1]!.rotation.x = -1.05;
          ctx.audio.playRustle(commuter.root.position, "a page turns");
        }
      },
      cleanup() {},
    };
  },
};
