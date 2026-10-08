/**
 * watcher.far — a dark figure stands mid-corridor past the junction
 * machine, dead still, facing you. Close to within ~4 m and it is simply
 * gone — a faint step is all that answers. Unmistakable, the game's
 * signature scare: approach is the only way to clear it.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FIGURE_POS = new Vector3(0.35, 0, 49.5);
const VANISH_Z = 45;

export const watcherFar: AnomalyDef = {
  id: "watcher.far",
  displayName: "Figure at the Junction",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7, // rare — it should stay an event
  progressionRange: [15, 100],
  requires: ["junction.machine"],
  excludes: ["figure"],
  testSeed: "test.watcher.far",
  dangerous: false,
  activate(ctx) {
    const world = ctx.world;
    const scene = ctx.scene;
    // ~1.9 m silhouette — full humanoid outline, featureless
    const fig = buildFigure(scene, world.root, "anomaly.watcher", {
      kind: "silhouette",
      material: world.materials.rubber,
      heightScale: 1.07,
    });
    const g = fig.root;
    g.position.copyFrom(FIGURE_POS);
    g.rotation.y = Math.PI; // squared up at the player's approach

    let gone = false;
    return {
      update() {
        if (gone) return;
        if (ctx.player.position.z > VANISH_Z) {
          gone = true;
          g.setEnabled(false);
          // a single soft step where it stood — the only trace
          ctx.audio.playFootstep(FIGURE_POS.clone(), 0.9, true);
        }
      },
      cleanup() {
        g.dispose(false, true);
      },
    };
  },
};
