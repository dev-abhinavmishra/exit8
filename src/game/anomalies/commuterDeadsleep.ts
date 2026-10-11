import type { AnomalyDef } from "./types";

/**
 * commuter.deadsleep — he is asleep on the bench, unmistakably —
 * chin to chest, paper slid to his lap — and STILL lifts his chin in
 * greeting when the inspector crosses. A courtesy his body performs
 * without him. Subtle; impossible.
 */
export const commuterDeadsleep: AnomalyDef = {
  id: "commuter.deadsleep",
  displayName: "Greets In His Sleep",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 70],
  requires: ["commuter"],
  excludes: ["commuter.ignores", "walker.greets"],
  testSeed: "test.commuter.deadsleep",
  dangerous: false,
  activate(ctx) {
    ctx.world.commuter.reset(true, "doze");
    ctx.world.commuter.setDozeGreetAllowed(true);
    return {
      update(_dt: number) {},
      cleanup() {
        ctx.world.commuter.setDozeGreetAllowed(false);
      },
    };
  },
};
