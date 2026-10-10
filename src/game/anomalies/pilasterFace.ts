/**
 * pilaster.face — someone stands nose-to-wall against the west column
 * at z≈52.5, perfectly still, face pressed to the concrete. Not
 * peeking — facing. Reach the lift lobby and the column is bare.
 * Unmistakable figure-class; the corner-stand read, not the peeker.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const pilasterFace: AnomalyDef = {
  id: "pilaster.face",
  displayName: "Face To The Wall",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [30, 100],
  requires: ["col.w.3"],
  excludes: [
    "figure.corridor",
    "figure.south",
    "figure.north",
    "figure.corner",
    "figure.records",
    "figure.fountain",
    "gate.keeper",
    "supply.figure",
    "watcher.follows",
    "walker.crowd",
    "creature.tall",
    "walker.long",
  ],
  testSeed: "test.pilaster.face",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.pilaster.face", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    // corridor-side of the column face, nose toward the wall (+... west
    // wall faces +x; the figure faces -x into the column)
    node.position.set(-1.32 + rng.range(-0.04, 0.04), 0, 52.5);
    node.rotation.y = Math.PI / 2;
    let gone = false;
    return {
      update() {
        if (gone) return;
        const p = ctx.player.position;
        const dx = p.x - node.position.x;
        const dz = p.z - node.position.z;
        const d2 = dx * dx + dz * dz;
        // never turns — that is the point — but vanishes at the lobby
        if (d2 < 1.35) {
          gone = true;
          node.setEnabled(false);
          ctx.audio.caption("nobody at the column", null);
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
