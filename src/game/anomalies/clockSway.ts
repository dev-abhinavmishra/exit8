import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.sway — the hanging clock swings on its stem like something
 * bumped it, and never settles. Moderate.
 */
export const clockSway: AnomalyDef = {
  id: "clock.sway",
  displayName: "The Clock Is Swinging",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["clock.head"],
  excludes: ["clock.low", "clock.fallen"],
  testSeed: "test.clock.sway",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const head = world.registry.mesh("clock.head");
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        head.rotation.z = Math.sin(t * 1.9) * 0.14;
        head.rotation.x = Math.sin(t * 1.35) * 0.05;
      },
      cleanup() {
        head.rotation.set(0, 0, 0);
      },
    };
  },
};
