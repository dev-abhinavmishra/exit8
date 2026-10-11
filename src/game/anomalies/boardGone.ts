import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * board.gone — board unbolted and taken: stem hangs empty, a pale
 * plaster scar shows on the ceiling where the mount sat. Moderate.
 */
export const boardGone: AnomalyDef = {
  id: "board.gone",
  displayName: "The Board Is Gone",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["board.head"],
  excludes: ["board", "board.tilt", "board.dark", "board.notin", "board.flick"],
  testSeed: "test.board.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const head = ctx.world.registry.get("board.head");
    const kids = head.getChildMeshes(false, (m) => m.name !== "board.stem");
    kids.forEach((m) => m.setEnabled(false));
    const scarMat = new StandardMaterial("mat.board.scar", ctx.scene);
    scarMat.diffuseColor = new Color3(0.62, 0.6, 0.55);
    scarMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const scar = CreateBox("anomaly.board.scar", { width: 1.6, height: 0.012, depth: 0.1 }, ctx.scene);
    scar.material = scarMat;
    scar.parent = ctx.world.root;
    scar.position.set(0, 2.93, 40.0);
    return {
      update() {},
      cleanup() {
        kids.forEach((m) => m.setEnabled(true));
        scar.dispose();
        scarMat.dispose();
      },
    };
  },
};
