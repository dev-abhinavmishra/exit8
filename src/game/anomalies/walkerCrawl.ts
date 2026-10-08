/**
 * walker.crawl — the other inspector still walks his route, but he
 * barely moves: a fifth of his pace, a slowed heavy stride. He will
 * not reach the end of the corridor this shift. Moderate
 * character-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const walkerCrawl: AnomalyDef = {
  id: "walker.crawl",
  displayName: "He Walks Too Slowly",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker",
    "walker.absent",
    "walker.stare",
    "walker.backwards",
    "walker.crowd",
    "walker.faceless",
  ],
  testSeed: "test.walker.crawl",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("crawl");
    return {
      update() {},
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
