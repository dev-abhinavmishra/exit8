/**
 * chalk.marks — tally marks scratched in chalk beside the junction:
 * short gate clusters of pale strokes on the east wall, counting
 * something. Not a sign and not a notice — marks left by a hand.
 * Subtle; small and low-contrast on the tile.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef } from "./types";

export const chalkMarks: AnomalyDef = {
  id: "chalk.marks",
  displayName: "Tally Marks",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["wall.right.0c"],
  excludes: ["corridor.scrawl", "patina.crack"],
  testSeed: "test.chalk.marks",
  dangerous: false,
  activate(ctx) {
    const tex = new DynamicTexture("anomaly.chalk.tally", { width: 128, height: 96 }, ctx.scene, true);
    const c = tex.getContext() as unknown as CanvasRenderingContext2D;
    c.clearRect(0, 0, 128, 96);
    c.strokeStyle = "rgba(226,222,206,0.85)";
    c.lineWidth = 3;
    c.lineCap = "round";
    // five-bar gates — three clusters, 5 + 5 + 4 strokes
    const clusters = [
      { x: 14, n: 5 },
      { x: 58, n: 5 },
      { x: 100, n: 4 },
    ];
    for (const cl of clusters) {
      for (let i = 0; i < Math.min(4, cl.n); i++) {
        const x = cl.x + i * 7;
        c.beginPath();
        c.moveTo(x + ctx.rng.range(-1, 1), 30 + ctx.rng.range(-2, 2));
        c.lineTo(x + ctx.rng.range(-1, 1), 66 + ctx.rng.range(-2, 2));
        c.stroke();
      }
      if (cl.n === 5) {
        c.beginPath();
        c.moveTo(cl.x - 5, 62);
        c.lineTo(cl.x + 24, 34);
        c.stroke();
      }
    }
    tex.update();
    tex.hasAlpha = true;
    const mat = new StandardMaterial("mat.chalk.tally", ctx.scene);
    mat.diffuseTexture = tex;
    mat.specularColor = Color3.Black();
    mat.useAlphaFromDiffuseTexture = true;
    const p = CreatePlane(
      "anomaly.chalk.tally",
      { width: 0.5, height: 0.38, sideOrientation: Mesh.DOUBLESIDE },
      ctx.scene,
    );
    p.material = mat;
    p.parent = ctx.world.root;
    // east wall beside the junction bay — faces -x into the corridor
    p.rotation.y = -Math.PI / 2;
    p.position = new Vector3(LAYOUT.corridor.xHalf - 0.012, 1.35, 25.5);
    return {
      update() {},
      cleanup() {
        p.dispose();
        mat.dispose();
        tex.dispose();
      },
    };
  },
};
