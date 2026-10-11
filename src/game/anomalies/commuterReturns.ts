import type { AnomalyDef } from "./types";

/**
 * commuter.returns — he gathers his bag, walks out the south door like
 * any other loop… and eight seconds later he's back on the bench,
 * reading, exactly where he sat. Impossible — the door only opened
 * once. The def schedules the baseline departure itself so the beat
 * always plays, then re-seats him on the same pose.
 */
export const commuterReturns: AnomalyDef = {
  id: "commuter.returns",
  displayName: "Back On the Bench",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.twin", "commuter.stays"],
  testSeed: "test.commuter.returns",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    // always seated, always scheduled — the anomaly IS the return
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 14 });
    let goneT = -1;
    let back = false;
    return {
      update(dt: number) {
        if (commuter.departState() === "gone" && goneT < 0) goneT = 0;
        if (goneT >= 0) {
          goneT += dt;
          if (!back && goneT > 8) {
            back = true;
            commuter.reset(true, "seat");
            ctx.audio.caption("the man who left is back on the bench", null);
          }
        }
      },
      cleanup() {},
    };
  },
};
