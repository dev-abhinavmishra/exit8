/**
 * skin.shift — the corridor's skin drifts one tier deeper and back on
 * a slow cycle: grime that wasn't there a minute ago, troffers that
 * burn out and heal while you watch the far end.
 */
import { applyChapterSkin, getChapterSkin } from "../../world/chapterSkin";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const skinShift: AnomalyDef = {
  id: "skin.shift",
  displayName: "The Years Breathe",
  chapter: 2,
  category: "systemic",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["ceil"],
  excludes: ["skin.deepest", "skin.pristine", "skin.split"],
  testSeed: "test.skin.shift",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c0 = getChapterSkin(ctx.world);
    const deep = Math.min(3, c0 + 1);
    if (deep === c0) return { update() {}, cleanup() {} };
    let acc = 0;
    let down = false;
    return {
      update(dt: number) {
        acc += dt;
        if (acc < 14) return;
        acc = 0;
        down = !down;
        applyChapterSkin(ctx.world, down ? deep : c0);
      },
      cleanup() {
        applyChapterSkin(ctx.world, c0);
      },
    };
  },
};
