/**
 * figure.south — somebody is waiting in the south airlock. The inner
 * doors part at the commit approach and a dark figure is standing dead
 * centre beyond the threshold, exactly where the route says nobody is.
 * It never moves — the judgment resolves before you reach it.
 * Unmistakable.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FIG_Z = 58.7;

export const figureSouth: AnomalyDef = {
  id: "figure.south",
  displayName: "Figure Past the Doors",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [35, 100],
  requires: ["al.south.cap"],
  excludes: ["watcher.follows", "figure"],
  testSeed: "test.figure.south",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.south", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(0, 0, FIG_Z);
    node.rotation.y = Math.PI; // squared up at the corridor
    fig.headPivot.rotation.z = 0.14; // the small wrongness: a tilted head

    return {
      update() {},
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
