/**
 * poster.tilted — one poster in the notice row hangs crooked in its
 * frame, leaned a few degrees off level. Subtle object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const posterTilted: AnomalyDef = {
  id: "poster.tilted",
  displayName: "Poster Hangs Crooked",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["poster.0", "poster.1", "poster.2"],
  excludes: ["wall.left.poster", "poster.swapped", "poster.changed", "poster.dup", "posters.mirror"],
  testSeed: "test.poster.tilted",
  dangerous: false,
  activate(ctx) {
    const i = ctx.rng.int(0, 3);
    const p = ctx.world.registry.mesh(`poster.${i}`);
    const rz = p.rotation.z;
    p.rotation.z = rz + ctx.rng.pick([-0.16, 0.16]);
    return {
      update() {},
      cleanup() {
        p.rotation.z = rz;
      },
    };
  },
};
