/**
 * sheets.cleared — the notice board by the north end is always pinned
 * with typed CWA memos. Tonight every sheet is gone: bare cork, pins and
 * all. A memorization check — the board itself is exactly where it was.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";

export const sheetsCleared: AnomalyDef = {
  id: "sheets.cleared",
  displayName: "Stripped Notice Board",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["notice.board"],
  excludes: ["notice.amends"],
  testSeed: "test.sheets.cleared",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const board = world.registry.get("notice.board");
    const sheets = board.getChildMeshes().filter((m) => m.name.startsWith("notice.sheet."));
    sheets.forEach((m) => m.setEnabled(false));
    // second tell — one sheet lies dropped at the board's base
    const dropMat = new StandardMaterial("mat.anomaly.sheetdrop", ctx.scene);
    dropMat.diffuseColor = new Color3(0.55, 0.53, 0.48);
    const drop = CreatePlane("anomaly.sheet.drop", { width: 0.2, height: 0.28 }, ctx.scene);
    drop.material = dropMat;
    drop.position.set(1.62, 0.006, 7.35);
    drop.rotation.x = -Math.PI / 2;
    drop.rotation.z = 0.4;
    return {
      update() {},
      cleanup() {
        sheets.forEach((m) => m.setEnabled(true));
        drop.dispose();
        dropMat.dispose();
      },
    };
  },
};
