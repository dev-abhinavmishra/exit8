/**
 * supply.figure — someone stands inside the cage behind the bars,
 * face to the grille, still. Inside ~9m his head finds you; press up
 * to the ledge and the cage is empty. Unmistakable figure-class.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const supplyFigure: AnomalyDef = {
  id: "supply.figure",
  displayName: "The Stockman",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [30, 100],
  requires: ["supply.grille"],
  excludes: [
    "figure.corridor",
    "figure.south",
    "figure.north",
    "figure.corner",
    "figure.records",
    "figure.fountain",
    "gate.keeper",
    "watcher.follows",
    "walker.crowd",
    "creature.tall",
    "walker.long",
    "supply.open",
  ],
  testSeed: "test.supply.figure",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.supply.figure", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    // inside the recess, face to the grille (−x), against the lit back wall
    node.position.set(1.98 + rng.range(-0.08, 0.08), 0, 35.0 + rng.range(-0.4, 0.4));
    node.rotation.y = -Math.PI / 2;
    let gone = false;
    return {
      update() {
        if (gone) return;
        const p = ctx.player.position;
        const dx = p.x - node.position.x;
        const dz = p.z - node.position.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 81) {
          const want = Math.atan2(dx, dz) - node.rotation.y;
          fig.headPivot.rotation.y += (want - fig.headPivot.rotation.y) * 0.04;
        }
        if (d2 < 1.7) {
          gone = true;
          node.setEnabled(false);
          ctx.audio.caption("nobody in the cage", null);
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
