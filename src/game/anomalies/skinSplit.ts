/**
 * skin.split — the corridor's two halves wear different chapters:
 * the north end keeps today's skin while the south end is already at
 * the red dusk — a hard seam mid-route where the years changed.
 */
import { applyChapterSkin, applySplitSkin, getChapterSkin } from "../../world/chapterSkin";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const skinSplit: AnomalyDef = {
  id: "skin.split",
  displayName: "Half The Years",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["ceil"],
  excludes: ["skin.deepest", "skin.pristine", "skin.shift"],
  testSeed: "test.skin.split",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c0 = getChapterSkin(ctx.world);
    applySplitSkin(ctx.world, 1, 3);
    return {
      update() {},
      cleanup() {
        applyChapterSkin(ctx.world, c0);
      },
    };
  },
};
