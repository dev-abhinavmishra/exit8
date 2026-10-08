/**
 * figure.corridor — from loop start, a dark figure stands mid-route,
 * squared on the corridor's center line. Walk toward it and it is
 * simply gone — not moved, not hidden, gone — once you close the
 * distance. The corridor keeps no witness. Unmistakable while it
 * lasts; easy to doubt after.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FIG_Z = 46;

export const figureCorridor: AnomalyDef = {
  id: "figure.corridor",
  displayName: "Someone On The Route",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["wall.right.2"],
  excludes: ["figure", "watcher.follows", "walker.crowd"],
  testSeed: "test.figure.corridor",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.corridor", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(0, 0, FIG_Z);
    node.rotation.y = Math.PI; // squared up the corridor, facing north
    const vanishZ = rng.range(36, 41);
    let gone = false;
    return {
      update() {
        if (gone) return;
        if (ctx.player.position.z > vanishZ) {
          gone = true;
          node.setEnabled(false);
          ctx.audio.caption("the figure is gone", null);
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
