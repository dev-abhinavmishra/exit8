/**
 * walker.charge — the inspector runs at you. The man you have learned
 * to ignore breaks off his route and sprints down his lane to a step
 * behind you, then holds at your shoulder while you keep walking.
 * The reference's signature scare — and now it costs: letting him
 * reach you docks the run's stability. The play is to file before he
 * arrives, not to walk on with him at your back. Dangerous
 * character-class anomaly.
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
  dangerous: true,
  activate(ctx) {
    ctx.world.ambientWalker.setMode("charge");
    // avoidable in-fiction: cross a commit plane and file before he
    // closes — letting him reach your shoulder is what costs you
    let reached = false;
    return {
      update() {
        ctx.world.ambientWalker.chargeAt(ctx.player.position.z);
        if (!reached) {
          const w = ctx.world.registry.get("ambient.walker");
          const d = w
            ? Math.hypot(w.position.x - ctx.player.position.x, w.position.z - ctx.player.position.z)
            : Infinity;
          if (d < 1.35) {
            reached = true;
            ctx.penalize?.(6);
            ctx.player.jolt(0.6);
            ctx.audio.playBreath(ctx.player.position.clone(), "a breath at your shoulder");
            ctx.audio.caption("he reached you — the route felt it", null);
          }
        }
      },
      cleanup() {
        ctx.world.ambientWalker.setMode("normal");
      },
    };
  },
};
