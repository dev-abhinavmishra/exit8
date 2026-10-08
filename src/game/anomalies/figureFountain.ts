/**
 * figure.fountain — a dark figure stoops over the drinking fountain,
 * head down at the bubbler like it's drinking. From up-corridor it is
 * a person-shaped mass where the pale basin should be; when you close
 * the last few metres it is simply gone. Unmistakable.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FOUNTAIN_X = 1.22;
const FOUNTAIN_Z = 37.5;

export const figureFountain: AnomalyDef = {
  id: "figure.fountain",
  displayName: "Drinker at the Fountain",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [30, 100],
  requires: ["prop.fountain"],
  excludes: [
    "figure.corridor",
    "figure.south",
    "figure.north",
    "figure.corner",
    "figure.records",
    "watcher.follows",
    "walker.crowd",
    "fountain.runs",
    "fountain.blood",
  ],
  testSeed: "test.figure.fountain",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.fountain", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(FOUNTAIN_X - 0.42, 0, FOUNTAIN_Z + rng.range(-0.15, 0.15));
    node.rotation.y = Math.PI / 2; // back to the corridor, facing the fountain/wall
    fig.headPivot.rotation.x = 0.42; // stooped over the basin
    node.rotation.x = 0.1;
    const vanishR = rng.range(2.4, 3.4);
    let gone = false;
    return {
      update() {
        if (gone) return;
        const p = ctx.player.position;
        const dx = p.x - node.position.x;
        const dz = p.z - node.position.z;
        if (dx * dx + dz * dz < vanishR * vanishR) {
          gone = true;
          node.setEnabled(false);
          ctx.audio.caption("nobody at the fountain", null);
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
