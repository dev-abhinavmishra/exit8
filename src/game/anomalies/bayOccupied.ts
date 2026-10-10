/**
 * bay.occupied — from loop start, a figure stands inside the S-2 bay at
 * the machine, back squared to the corridor, mid-task. Nobody works the
 * bay on a late audit; the corridor knows its fixtures, and this is
 * not one of them. Moderate — the recess is dim and the shape is
 * half-sheltered by the machine, so you catch it at the mouth.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

export const bayOccupied: AnomalyDef = {
  id: "bay.occupied",
  displayName: "Someone In The Bay",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["junction.machine"],
  excludes: ["figure", "shadow.figure", "lights.blackout", "watcher.follows"],
  testSeed: "test.bay.occupied",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.bay.occupied", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    // inside the recess, facing the machine — back to the corridor
    node.position.set(-2.05, 0, 47.3);
    node.rotation.y = -Math.PI / 2;
    return {
      update() {},
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
