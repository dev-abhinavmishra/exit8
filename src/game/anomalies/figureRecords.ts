/**
 * figure.records — a figure stands at the records bank with its back
 * to the corridor, face into the drawer fronts as if reading the
 * labels. Seen from down-route it is a dark shape against the pale
 * cabinets; when you close on it, it is simply not there.
 * Unmistakable.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const figureRecords: AnomalyDef = {
  id: "figure.records",
  displayName: "Figure at the Records Bank",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.65,
  progressionRange: [30, 100],
  requires: ["records.cabinets"],
  excludes: [
    "figure.corridor",
    "figure.south",
    "figure.north",
    "figure.corner",
    "watcher.follows",
    "walker.crowd",
  ],
  testSeed: "test.figure.records",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.records", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    // records bank spans the west wall z≈12–32; stand it close, back to the corridor
    node.position.set(-1.28, 0, rng.range(16, 27));
    node.rotation.y = -Math.PI / 2; // facing the west wall, back to the route
    fig.headPivot.rotation.x = -0.1; // head tipped up at the drawer labels
    const vanishZ = rng.range(2.2, 3.2);
    let gone = false;
    return {
      update() {
        if (gone) return;
        const p = ctx.player.position;
        const dx = p.x - node.position.x;
        const dz = p.z - node.position.z;
        if (dx * dx + dz * dz < vanishZ * vanishZ) {
          gone = true;
          node.setEnabled(false);
          ctx.audio.caption("nobody at the cabinets", null);
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
