/**
 * skin.deepest — the route wears its CH III skin a tier early: red
 * dusk, burned troffers, litter — before competence should have
 * earned it. The corridor is showing you where this ends.
 */
import { applyChapterSkin, getChapterSkin } from "../../world/chapterSkin";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const skinDeepest: AnomalyDef = {
  id: "skin.deepest",
  displayName: "Worn Ahead",
  chapter: 1,
  category: "systemic",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["ceil"],
  excludes: ["skin.pristine", "skin.split", "skin.shift"],
  testSeed: "test.skin.deepest",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c0 = getChapterSkin(ctx.world);
    if (c0 >= 3) return { update() {}, cleanup() {} };
    applyChapterSkin(ctx.world, 3);
    return {
      update() {},
      cleanup() {
        applyChapterSkin(ctx.world, c0);
      },
    };
  },
};
