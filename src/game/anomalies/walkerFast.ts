/**
 * walker.fast — the inspector walks his route at nearly twice his
 * usual pace. Same path, same stride shape — just wrong. The man in
 * the original hurries; so does ours now. Subtle character-class
 * anomaly.
 */
import type { AnomalyDef } from "./types";

export const walkerFast: AnomalyDef = {
  id: "walker.fast",
  displayName: "Inspector Moving Fast",
  chapter: 3,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker",
    "walker.absent",
    "walker.stare",
    "walker.backwards",
    "walker.crawl",
    "walker.faceless",
    "walker.crowd",
  ],
  testSeed: "test.walker.fast",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("fast");
    return {
      update() {},
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
