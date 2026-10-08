/**
 * notice.amends — one of the rota sheets pinned to the notice board
 * reads differently tonight. Subtle: paper, layout and typography are
 * identical — only two duty lines have been amended, and only someone
 * who actually read the sheet will catch it.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawNote } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const noticeAmends: AnomalyDef = {
  id: "notice.amends",
  displayName: "Amended Bulletin",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["notice.board"],
  excludes: ["sheets.cleared", "sheets.added"],
  testSeed: "test.notice.amends",
  dangerous: false,
  activate(ctx) {
    const { world, scene } = ctx;
    const board = world.registry.mesh("notice.board");
    const sheets = board.getChildMeshes().filter((m) => m.name.startsWith("notice.sheet."));
    if (!sheets.length) return { update() {}, cleanup() {} };
    const sheet = sheets[ctx.rng.int(0, sheets.length - 1)]!;
    const prev = sheet.material;

    const t = new DynamicTexture("anomaly.notice.amended", { width: 192, height: 256 }, scene, true);
    // same rota layout as the shared sheet — two lines quietly amended
    drawNote(t, {
      title: "NIGHT ROTA — W/C 7",
      lines: [
        "SURVEY LOOP 7: 22:00–06:00",
        "FILE AT BOTH POINTS",
        "LOG ALL DIVERGENCES",
        "GALLERY: NO ENTRY",
        "LIFT S-2: IN SERVICE",
        "REPORT TO DESK 9",
      ],
    });
    const mat = new StandardMaterial("anomaly.notice.amended.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    mat.emissiveColor = new Color3(0.35, 0.35, 0.33);
    mat.specularColor = new Color3(0.02, 0.02, 0.02);
    sheet.material = mat;

    return {
      update() {},
      cleanup() {
        sheet.material = prev;
        mat.dispose();
        t.dispose();
      },
    };
  },
};
