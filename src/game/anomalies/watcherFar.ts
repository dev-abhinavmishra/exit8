/**
 * watcher.far — a dark figure stands mid-corridor past the junction
 * machine, dead still, facing you. Close to within ~4 m and it is simply
 * gone — a faint step is all that answers. Unmistakable, the game's
 * signature scare: approach is the only way to clear it.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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
    const g = new TransformNode("anomaly.watcher", scene);
    g.parent = world.root;
    // stylized silhouette ~1.9 m: coat-body + shoulders + head, unlit dark
    const body = CreateBox("anomaly.watcher.body", { width: 0.5, height: 1.42, depth: 0.28 }, scene);
    body.material = world.materials.rubber;
    body.position = new Vector3(FIGURE_POS.x, 0.86, FIGURE_POS.z);
    body.parent = g;
    const shoulders = CreateBox(
      "anomaly.watcher.shoulders",
      { width: 0.64, height: 0.14, depth: 0.32 },
      scene,
    );
    shoulders.material = world.materials.rubber;
    shoulders.position = new Vector3(FIGURE_POS.x, 1.55, FIGURE_POS.z);
    shoulders.parent = g;
    const head = CreateBox("anomaly.watcher.head", { width: 0.22, height: 0.32, depth: 0.24 }, scene);
    head.material = world.materials.rubber;
    head.position = new Vector3(FIGURE_POS.x, 1.78, FIGURE_POS.z);
    head.parent = g;

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
