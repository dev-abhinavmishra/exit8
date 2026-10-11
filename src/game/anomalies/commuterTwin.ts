/**
 * commuter.twin — a second man sits at the far end of the same bench:
 * same build, same plain clothes, same folded paper — reading it the
 * same way. Unmistakable.
 */
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterTwin: AnomalyDef = {
  id: "commuter.twin",
  displayName: "Two Men, One Bench",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["commuter"],
  excludes: ["commuter.down", "commuter.bench"],
  testSeed: "test.commuter.twin",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    c.reset(true); // make sure he is home so the twin lands beside him
    const node = new TransformNode("commuter.twin", ctx.scene);
    node.parent = c.root.parent;
    const fig = buildFigure(ctx.scene, node, "commuter.twin.fig", { kind: "inspector" });
    const g = fig.root;
    for (const m of g.getChildMeshes()) {
      if (m.name.includes(".stripe") || m.name.includes(".cap.") || m.name.includes(".idcard")) {
        m.setEnabled(false);
      }
    }
    g.position.set(-1.3, 0.42, 34.1);
    g.rotation.set(0, Math.PI / 2 - 0.15, 0);
    fig.hips[0]!.rotation.x = -1.45;
    fig.hips[1]!.rotation.x = -1.5;
    fig.arms[0]!.rotation.x = -0.62;
    fig.arms[1]!.rotation.x = -0.7;
    fig.headPivot.rotation.set(0.42, 0.05, 0);
    return {
      update() {},
      cleanup() {
        node.dispose();
        c.reset(was);
      },
    };
  },
};
