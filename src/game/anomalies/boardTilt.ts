import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * board.tilt — the board still reads fine, but it hangs racked off
 * level on its stem, like one bolt gave. Moderate — visible against
 * the corridor's straight rails.
 */
export const boardTilt: AnomalyDef = {
  id: "board.tilt",
  displayName: "The Board Hangs Crooked",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["board.head"],
  excludes: ["board", "board.gone"],
  testSeed: "test.board.tilt",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const head = ctx.world.registry.get("board.head");
    head.rotation.z = 0.13;
    return {
      update() {},
      cleanup() {
        head.rotation.z = 0;
      },
    };
  },
};
