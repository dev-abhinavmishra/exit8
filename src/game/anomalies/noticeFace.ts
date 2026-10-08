/**
 * notice.face — among the typed rota sheets on the notice board there
 * is a photograph that was not pinned there before: a small bordered
 * print of a face, a touch too pale, eyes you can't quite read. You
 * only catch it if you actually read the board. Subtle.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawFace } from "../../world/figures";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef, AnomalyInstance } from "./types";

const BOARD_X = LAYOUT.corridor.xHalf - 0.08;

export const noticeFace: AnomalyDef = {
  id: "notice.face",
  displayName: "Photograph on the Board",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: ["notice.board"],
  excludes: ["sheets.cleared", "sheets.added"],
  testSeed: "test.notice.face",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;

    // bordered print: white photo margin, face printed centre
    const t = new DynamicTexture("anomaly.noticeface.tex", { width: 160, height: 200 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.fillStyle = "#ddd8cc";
    c.fillRect(0, 0, 160, 200);
    c.fillStyle = "#1a1713";
    c.fillRect(10, 10, 140, 150);
    t.update();
    const faceTex = new DynamicTexture("anomaly.noticeface.face", { width: 140, height: 150 }, scene, true);
    drawFace(faceTex, "eyeless");
    const ctx2d = t.getContext() as unknown as CanvasRenderingContext2D;
    ctx2d.drawImage((faceTex.getContext() as unknown as CanvasRenderingContext2D).canvas, 10, 10);
    t.update();

    const mat = new StandardMaterial("anomaly.noticeface.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    mat.emissiveColor = new Color3(0.14, 0.14, 0.14);
    mat.specularColor = Color3.Black();

    const photo = CreatePlane("anomaly.noticeface", { width: 0.16, height: 0.2 }, scene);
    photo.material = mat;
    photo.parent = world.root;
    photo.position = new Vector3(BOARD_X - 0.032, 1.62 + rng.range(-0.14, 0.1), 7 + rng.range(-0.45, 0.45));
    photo.rotation.y = Math.PI / 2; // board faces the corridor
    photo.rotation.z = rng.range(-0.06, 0.06);

    return {
      update() {},
      cleanup() {
        photo.dispose();
        mat.dispose();
        t.dispose();
        faceTex.dispose();
      },
    };
  },
};
