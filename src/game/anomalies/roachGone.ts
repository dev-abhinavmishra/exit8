import type { AnomalyDef } from "./types";

/**
 * roach.gone — the roach is absent tonight. The speck at the wall
 * base that was always there simply isn't. Subtle.
 */
export const roachGone: AnomalyDef = {
  id: "roach.gone",
  displayName: "No Roach Tonight",
  chapter: 1,
  category: "spatial",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [5, 100],
  requires: ["roach"],
  excludes: ["roach.swarm", "roach.dead", "roach.flees"],
  testSeed: "test.roach.gone",
  dangerous: false,
  activate(ctx) {
    const r = ctx.world.registry.get("roach");
    r.setEnabled(false);
    return {
      update() {},
      cleanup() {
        r.setEnabled(true);
      },
    };
  },
};
