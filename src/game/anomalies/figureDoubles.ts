/**
 * figure.doubles — there are TWO of them in the north airlock. Twin
 * silhouettes stand shoulder-to-shoulder beyond the glass, facing the
 * corridor, waiting behind the doors you have to commit through. The
 * doubled witness is unmistakable.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const figureDoubles: AnomalyDef = {
  id: "figure.doubles",
  displayName: "Two of Them",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.55,
  progressionRange: [35, 100],
  requires: ["al.north.cap"],
  excludes: ["figure.north", "face.pane.north", "watcher.follows", "walker.crowd", "airlock.breach"],
  testSeed: "test.figure.doubles",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const nodes = [-0.38, 0.38].map((x, i) => {
      const fig = buildFigure(scene, world.root, `anomaly.figure.doubles.${i}`, {
        kind: "silhouette",
        material: world.materials.rubber,
      });
      fig.root.position.set(x + rng.range(-0.08, 0.08), 0, -3.8 + rng.range(-0.25, 0.25));
      fig.root.rotation.y = rng.range(-0.2, 0.2); // squared at the corridor
      fig.headPivot.rotation.z = (i === 0 ? 1 : -1) * rng.range(0.06, 0.16);
      return fig.root;
    });
    return {
      update() {},
      cleanup() {
        for (const n of nodes) n.dispose(false, true);
      },
    };
  },
};
