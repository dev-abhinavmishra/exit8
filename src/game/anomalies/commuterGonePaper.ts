import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * commuter.gone.paper — no commuter this loop, and his folded paper
 * is still on the seat — as if he left mid-read. Subtle.
 */
export const commuterGonePaper: AnomalyDef = {
  id: "commuter.gone.paper",
  displayName: "He Left Mid-Read",
  chapter: 1,
  category: "character",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["commuter"],
  excludes: ["commuter.upright", "commuter.stare", "commuter.down"],
  testSeed: "test.commuter.gone.paper",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    c.root.setEnabled(false);
    const mat = new StandardMaterial("mat.commuter.left", ctx.scene);
    mat.diffuseColor = new Color3(0.66, 0.64, 0.56);
    mat.specularColor = Color3.Black();
    const paper = CreatePlane("anomaly.commuter.left", { width: 0.24, height: 0.18 }, ctx.scene);
    paper.material = mat;
    paper.parent = ctx.world.root;
    paper.position.set(-1.32, 0.62, 33.35);
    paper.rotation.set(0.5, Math.PI / 2 - 0.3, 0.1);
    return {
      update() {},
      cleanup() {
        c.reset(was);
        paper.dispose();
        mat.dispose();
      },
    };
  },
};
