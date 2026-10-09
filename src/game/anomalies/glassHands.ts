/**
 * glass.hands — handprints pressed into the gallery glass's
 * condensation sheen, from INSIDE the observation room. One sits at
 * shoulder height, still sharp; a second dragged lower, streaked —
 * the hands slid down the pane. Somebody stood on the other side of
 * the smoked glass and pushed back.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

function drawPrint(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  rot: number,
  smear: number,
): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = "rgba(226,231,229,0.42)";
  // smear streaks dragged below the print — the slide down the pane
  if (smear > 0) {
    for (const fx of [-12, -4, 5, 13]) {
      const g = c.createLinearGradient(0, -4, 0, smear);
      g.addColorStop(0, "rgba(226,231,229,0.30)");
      g.addColorStop(1, "rgba(226,231,229,0)");
      c.fillStyle = g;
      c.fillRect(fx - 3.5, -4, 7, smear);
    }
    c.fillStyle = "rgba(226,231,229,0.42)";
  }
  // palm
  c.beginPath();
  c.ellipse(0, 14, 15, 19, 0, 0, Math.PI * 2);
  c.fill();
  // four fingers — uneven heights read as a real hand
  for (const [fx, fy, fl] of [
    [-13, -12, 15],
    [-4.5, -18, 21],
    [4.5, -16, 19],
    [13.5, -10, 13],
  ] as const) {
    c.beginPath();
    c.ellipse(fx, fy, 4.6, fl * 0.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  // thumb, angled out
  c.beginPath();
  c.ellipse(-18, 12, 4.6, 11, -0.75, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export const glassHands: AnomalyDef = {
  id: "glass.hands",
  displayName: "Hands On The Glass",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.65,
  progressionRange: [20, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery", "footsteps.extra", "glass.writing", "glass.eyes", "gallery.door"],
  testSeed: "test.glass.hands",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;

    const t = new DynamicTexture("anomaly.hands.tex", { width: 512, height: 256 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.clearRect(0, 0, 512, 256);
    // a sharp print at shoulder height, a dragged one below-left
    drawPrint(c, 330, 108, 1.55, rng.range(-0.16, 0.16), 0);
    drawPrint(c, 190, 150, 1.35, rng.range(-0.3, 0.1), 46);
    t.update();

    const mat = new StandardMaterial("anomaly.hands.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    mat.opacityTexture = t;
    mat.disableLighting = true;
    mat.backFaceCulling = false;

    const p = CreatePlane("anomaly.hands", { width: 1.15, height: 0.58 }, scene);
    p.material = mat;
    p.position = new Vector3(1.735 - 0.005, 1.52, rng.range(23.5, 28));
    p.rotation.y = Math.PI / 2; // faces -x into the corridor
    p.parent = world.root;

    return {
      update() {},
      cleanup() {
        p.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
