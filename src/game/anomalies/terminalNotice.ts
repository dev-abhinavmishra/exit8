/**
 * terminal.notice — a handbill is pasted over the south airlock terminal
 * telling inspectors to file at the north point instead. Subtle trap: it's
 * placed exactly where you commit, so attentive players read it last.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const terminalNotice: AnomalyDef = {
  id: "terminal.notice",
  displayName: "Misfiled Notice",
  chapter: 1,
  category: "systemic",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["al.south.terminal"],
  excludes: ["terminal"],
  testSeed: "test.terminal.notice",
  dangerous: false,
  activate(ctx) {
    const term = ctx.world.registry.mesh("al.south.terminal");
    const scene = ctx.scene;
    const t = new DynamicTexture("anomaly.notice.tex", { width: 256, height: 128 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.fillStyle = "#d8d2c4";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#8a2f26";
    c.font = "bold 24px Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("OUT OF ORDER", 128, 46);
    c.fillStyle = "#3a3630";
    c.font = "17px Arial, sans-serif";
    c.fillText("FILE AT NORTH POINT", 128, 78);
    c.fillText("— ROUTE INTEGRITY", 128, 102);
    t.update();
    const mat = new StandardMaterial("anomaly.notice.mat", scene);
    mat.diffuseTexture = t;
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    const note = CreatePlane("anomaly.notice", { width: 0.42, height: 0.21 }, scene);
    note.material = mat;
    // pasted at a slight skew over the terminal's lower half
    note.position = new Vector3(term.position.x + 0.05, term.position.y - 0.08, term.position.z + 0.1);
    note.rotation.y = term.rotation.y;
    note.rotation.z = -0.06;
    note.parent = term.parent;
    return {
      update() {},
      cleanup() {
        note.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
