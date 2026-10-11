/**
 * notice.amends — a dominant bulletin is pinned over the corkboard
 * center: same paper, same type, now reading "INSPECTIONS SUSPENDED
 * UNTIL FURTHER NOTICE". Subtle — the board still holds notices.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawNote } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const noticeAmends: AnomalyDef = {
  id: "notice.amends",
  displayName: "Amended Bulletin",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["notice.board"],
  excludes: ["sheets.cleared", "sheets.added"],
  testSeed: "test.notice.amends",
  dangerous: false,
  activate(ctx) {
    const board = ctx.world.registry.get("notice.board");
    if (!board) return { update() {}, cleanup() {} };
    const t = new DynamicTexture("tex.notice.amended", { width: 256, height: 352 }, ctx.scene, true);
    drawNote(t, {
      title: "NOTICE",
      lines: ["INSPECTIONS", "SUSPENDED UNTIL", "FURTHER NOTICE"],
    });
    const mat = new StandardMaterial("mat.notice.amended", ctx.scene);
    mat.diffuseTexture = t;
    mat.specularColor = Color3.Black();
    const sheet = CreatePlane("anomaly.notice.amended", { width: 0.4, height: 0.55 }, ctx.scene);
    sheet.material = mat;
    sheet.parent = board;
    sheet.position = new Vector3(-0.028, 0.02, 0.05);
    sheet.rotation.y = Math.PI / 2;
    sheet.rotation.z = -0.03;
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
