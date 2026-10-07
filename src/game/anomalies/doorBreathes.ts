/**
 * door.breathes — the service door leaf slowly pushes a centimeter out of
 * its frame and settles back, on a long uneven rhythm. Subtle — the kind
 * of thing you catch from the corner of your eye.
 */
import type { AnomalyDef } from "./types";

export const doorBreathes: AnomalyDef = {
  id: "door.breathes",
  displayName: "Breathing Service Door",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["service.door.leaf"],
  excludes: ["door.service"],
  testSeed: "test.door.breathes",
  dangerous: false,
  activate(ctx) {
    const leaf = ctx.world.registry.mesh("service.door.leaf");
    const x0 = leaf.position.x;
    const period = ctx.rng.range(6, 9);
    const amp = ctx.rng.range(0.018, 0.03);
    let t = ctx.rng.range(0, period);
    return {
      update(dt) {
        t += dt;
        // asymmetric swell: quick-ish press out, long settle home
        const k = (t % period) / period;
        const e = k < 0.3 ? Math.sin((k / 0.3) * Math.PI * 0.5) : Math.cos(((k - 0.3) / 0.7) * Math.PI * 0.5);
        leaf.position.x = x0 - amp * Math.max(0, e);
      },
      cleanup() {
        leaf.position.x = x0;
      },
    };
  },
};
