/**
 * figure.north — the divergence-side mirror of figure.south. When you
 * walk north to file a divergence, the inner doors part and a dark
 * figure stands dead centre in the airlock beyond — squared up at you,
 * head tilted. The route's judgment has a witness either way now.
 * Unmistakable.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FIG_Z = -3.8;

export const figureNorth: AnomalyDef = {
  id: "figure.north",
  displayName: "Figure in the North Airlock",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.65,
  progressionRange: [35, 100],
  requires: ["al.north.cap"],
  excludes: ["figure.south", "watcher.follows", "figure"],
  testSeed: "test.figure.north",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.north", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(0, 0, FIG_Z);
    // faces +z — squared up at the player approaching the north doors
    fig.headPivot.rotation.z = -0.14;

    return {
      update() {},
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
