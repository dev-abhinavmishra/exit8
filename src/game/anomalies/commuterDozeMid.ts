import type { AnomalyDef } from "./types";

/**
 * commuter.doze.mid — he starts the loop reading like always, and
 * mid-page he drifts off where you can see it happen: the paper
 * slides, the chin sinks, and he stays under for the rest of the
 * route. The transition itself is the wrongness — watched, not found.
 */
export const commuterDozeMid: AnomalyDef = {
  id: "commuter.doze.mid",
  displayName: "Drifted Off Mid-Page",
  chapter: 1,
  category: "character",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 60],
  requires: ["commuter"],
  excludes: [],
  testSeed: "test.commuter.doze.mid",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    let t = 0;
    let fired = false;
    return {
      update(dt: number) {
        t += dt;
        if (!fired && t > 11) {
          fired = true;
          commuter.startDoze();
          ctx.audio.caption("he drifted off mid-page", commuter.root.position);
        }
      },
      cleanup() {},
    };
  },
};
