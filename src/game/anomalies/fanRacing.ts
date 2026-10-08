/**
 * fan.racing — the extraction fan's steady slow spin is part of the
 * room's texture. Tonight it races — the blade a blur behind the
 * grille and the hum wound up a notch to match.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const fanRacing: AnomalyDef = {
  id: "fan.racing",
  displayName: "Fan Racing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["junction.machine.fan"],
  excludes: ["machine.silence", "lights.blackout"],
  testSeed: "test.fan.racing",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.fanSpeed = 4.2;
    ctx.audio.setMachineGainScale(() => 1.5);
    return {
      update() {},
      cleanup() {
        ctx.world.fanSpeed = 1;
        ctx.audio.setMachineGainScale(null);
      },
    };
  },
};
