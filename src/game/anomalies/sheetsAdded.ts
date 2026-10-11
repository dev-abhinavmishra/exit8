/**
 * sheets.added — the notice board's five typed memos have become six:
 * a fresh sheet pinned slightly crooked among them, same paper, same
 * type. Subtle — an extra memo where a count was memorized.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawNote } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const sheetsAdded: AnomalyDef = {
  id: "sheets.added",
  displayName: "A Sixth Memo",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["notice.board"],
  excludes: ["sheets.cleared", "notice.amends"],
  testSeed: "test.sheets.added",
  dangerous: false,
  activate(ctx) {
    const board = ctx.world.registry.get("notice.board");
    if (!board) return { update() {}, cleanup() {} };
    const t = new DynamicTexture("tex.sheet.extra", { width: 256, height: 352 }, ctx.scene, true);
    drawNote(t, {
      title: "SHIFT MEMO",
      lines: ["COUNT YOUR FILINGS", "IF THE BOARD READS", "BACK TO YOU, STOP", "AND WALK ON."],
    });
    const mat = new StandardMaterial("mat.sheet.extra", ctx.scene);
    mat.diffuseTexture = t;
    mat.specularColor = Color3.Black();
    const sheet = CreatePlane("anomaly.sheet.5", { width: 0.24, height: 0.32 }, ctx.scene);
    sheet.material = mat;
    sheet.parent = board;
    // sixth slot bottom-right of the five memo cluster, a few degrees off
    sheet.position = new Vector3(-0.028, -0.32, 0.42);
    sheet.rotation.y = Math.PI / 2;
    sheet.rotation.z = 0.09;
    return {
      update() {},
      cleanup() {
        sheet.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
