/**
 * egress.reversed — one marker on the photoluminescent strip points the
 * wrong way. Every other board says the airlock is that way; this one
 * says the opposite. Subtle — you have to read the strip, not just see
 * it. Mirrored by flipping the marker plane's x-scale, so the running
 * man stays upright but heads backwards.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const egressReversed: AnomalyDef = {
  id: "egress.reversed",
  displayName: "Wrong Way Out",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [15, 100],
  requires: ["dress.egress.4"],
  excludes: [],
  testSeed: "test.egress.reversed",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const marker = ctx.world.registry.mesh("dress.egress.4");
    marker.scaling.x = -1;
    return {
      update() {},
      cleanup() {
        marker.scaling.x = 1;
      },
    };
  },
};
