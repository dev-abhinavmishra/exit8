/**
 * walker.offlane — the inspector walks his route on the wrong side. Same
 * pace, same pauses, same clipboard read at the records end — but his
 * lane is the west edge of the guide strip instead of the east. The
 * corridor is exactly normal except the man has drifted two feet left.
 * Pure-memorization subtle anomaly: his lane is drilled into you by
 * every clean loop you have ever walked.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const walkerOfflane: AnomalyDef = {
  id: "walker.offlane",
  displayName: "The Wrong Lane",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker.absent",
    "walker.backwards",
    "walker.stare",
    "walker.crawl",
    "walker.fast",
    "walker.charge",
    "walker.midstep",
    "walker.wait",
    "walker.crowd",
    "walker.faceless",
    "walker.eyeless",
    "walker.look",
    "walker.hum",
  ],
  testSeed: "test.walker.offlane",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.ambientWalker.setMode("offlane");
    return {
      update() {},
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
