/**
 * fire.open — the fire cabinet's dark-glass window is gone: the cabinet
 * stands open on its bare red face. Subtle-moderate; a spec for players
 * who memorize fixtures.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const fireOpen: AnomalyDef = {
  id: "fire.open",
  displayName: "Fire Point Open",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["fire.point.glass"],
  excludes: ["fire.point"],
  testSeed: "test.fire.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const glass = ctx.world.registry.mesh("fire.point.glass");
    glass.setEnabled(false);
    return {
      update() {
        // static swap
      },
      cleanup() {
        glass.setEnabled(true);
      },
    };
  },
};
