/**
 * figure.corner — a figure peeks around the service-junction pilaster,
 * a sliver of head and shoulder visible past the corner of the wall.
 * It never steps out: when you close the distance it withdraws behind
 * the pilaster, and the junction is empty when you reach it.
 * Unmistakable while it lasts; easy to doubt after.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const PEEK_X = 1.42;
const PEEK_Z = 45.7;
const HIDE_Z = 46.7;

export const figureCorner: AnomalyDef = {
  id: "figure.corner",
  displayName: "Figure Around the Corner",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.65,
  progressionRange: [30, 100],
  requires: ["wall.right.2"],
  excludes: ["figure.corridor", "figure.south", "figure.north", "watcher.follows", "walker.crowd"],
  testSeed: "test.figure.corner",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.corner", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(PEEK_X, 0, PEEK_Z);
    node.rotation.y = -Math.PI / 2 + 0.35; // squared at the corridor, slight lean
    fig.headPivot.rotation.z = -0.12;
    const withdrawZ = rng.range(41.5, 43.5);
    let withdrawing = false;
    let gone = false;
    return {
      update(dt) {
        if (gone) return;
        if (!withdrawing && ctx.player.position.z > withdrawZ) {
          withdrawing = true;
          ctx.audio.caption("it pulled back around the corner", null);
        }
        if (withdrawing) {
          node.position.z += dt * 1.4;
          if (node.position.z >= HIDE_Z) {
            gone = true;
            node.setEnabled(false);
          }
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
