/**
 * figure.wall — a dark figure stands at the east wall, nose to the
 * panels, arms at its sides, as if counting tile or hiding its face.
 * It does not move while you can see it. Once you have walked well
 * past, the next glance back finds it turned to face up-corridor —
 * it never approaches, it only turned. Unmistakable once noticed;
 * easy to doubt before.
 */
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FIG_X = 1.48;
const FIG_Z = 34.2;

export const figureWall: AnomalyDef = {
  id: "figure.wall",
  displayName: "Facing The Wall",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [25, 100],
  requires: ["wall.right.2a"],
  excludes: ["figure", "watcher.follows", "walker.crowd", "gallery.eyes", "glass.eyes"],
  testSeed: "test.figure.wall",
  dangerous: false,
  activate(ctx) {
    const fig = buildFigure(ctx.scene, ctx.world.root, "anomaly.figure.wall", {
      kind: "silhouette",
      material: ctx.world.materials.rubber,
    });
    const node = fig.root;
    node.position.set(FIG_X, 0, FIG_Z);
    node.rotation.y = Math.PI / 2; // nose to the east panels
    let turned = false;
    return {
      update() {
        if (turned) return;
        // only once the player has walked well past — off its shoulder —
        // does it turn; from then it faces whoever looks back
        if (ctx.player.position.z > FIG_Z + 7) {
          turned = true;
          node.rotation.y = Math.PI; // squared up-corridor, facing north
        }
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
