/**
 * skin.pristine — a deep-shift loop arrives showroom-clean: troffers
 * burning, grout lines crisp, no litter, no dusk. The route forgot
 * what it's been through — which is worse than any grime.
 */
import { applyChapterSkin, getChapterSkin } from "../../world/chapterSkin";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const skinPristine: AnomalyDef = {
  id: "skin.pristine",
  displayName: "Still Day One",
  chapter: 2,
  category: "systemic",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["ceil"],
  excludes: ["skin.deepest", "skin.split", "skin.shift"],
  testSeed: "test.skin.pristine",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c0 = getChapterSkin(ctx.world);
    if (c0 <= 1) return { update() {}, cleanup() {} };
    applyChapterSkin(ctx.world, 1);
    return {
      update() {},
      cleanup() {
        applyChapterSkin(ctx.world, c0);
      },
    };
  },
};
