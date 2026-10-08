/**
 * fan.dead — the junction machine's extraction fan turns behind its
 * grille every loop; tonight the blade stands still while the cabinet
 * still thrums. A stopped motion, not a missing thing — the machine
 * sounds alive and isn't.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const fanDead: AnomalyDef = {
  id: "fan.dead",
  displayName: "Fan Standing Still",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["junction.machine.fan"],
  excludes: ["machine.silence", "lights.blackout"],
  testSeed: "test.fan.dead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.fanSpeed = 0;
    return {
      update() {},
      cleanup() {
        ctx.world.fanSpeed = 1;
      },
    };
  },
};
