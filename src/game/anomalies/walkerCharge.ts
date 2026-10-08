/**
 * walker.charge — the inspector runs at you. The man you have learned
 * to ignore breaks off his route and sprints down his lane to a step
 * behind you, then holds at your shoulder while you keep walking.
 * The reference's signature scare. Unmistakable character-class
 * anomaly.
 */
import type { AnomalyDef } from "./types";

export const walkerCharge: AnomalyDef = {
  id: "walker.charge",
  displayName: "The Inspector Runs At You",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [40, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker",
    "walker.absent",
    "walker.stare",
    "walker.backwards",
    "walker.crawl",
    "walker.faceless",
    "walker.crowd",
    "walker.fast",
    "watcher.follows",
    "figure.south",
  ],
  testSeed: "test.walker.charge",
  dangerous: false,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("charge");
    return {
      update() {
        ctx.world.ambientWalker.chargeAt(ctx.player.position.z);
      },
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
