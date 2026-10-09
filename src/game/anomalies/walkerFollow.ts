/**
 * walker.follow — the inspector gives up his route and just walks with
 * you: ~3 m behind whichever end you're heading away from, matching
 * your pace. Stop and he stops. Turn around and he's mid-stride — or
 * already standing there waiting on you. Moderate: you hear his
 * cadence fall into yours before you see it.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const walkerFollow: AnomalyDef = {
  id: "walker.follow",
  displayName: "In Step Behind You",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.6,
  progressionRange: [10, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker.absent",
    "walker.charge",
    "walker.stare",
    "walker.crawl",
    "walker.midstep",
    "walker.backwards",
    "walker.fast",
    "walker.notes",
  ],
  testSeed: "test.walker.follow",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const walker = ctx.world.ambientWalker;
    walker.setMode("follow");
    return {
      update() {},
      cleanup() {
        walker.setMode("normal");
      },
    };
  },
};
