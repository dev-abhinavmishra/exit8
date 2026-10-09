/**
 * glass.writing — a word is fingered into the condensation sheen on
 * the observation glass, written FROM the corridor side. The strokes
 * are still wet: someone stood exactly where you are standing and
 * wanted it counted.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const glassWriting: AnomalyDef = {
  id: "glass.writing",
  displayName: "Writing On The Glass",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [35, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery", "footsteps.extra", "gallery.door"],
  testSeed: "test.glass.writing",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const word = rng.pick(["COUNT AGAIN", "NOT 7", "STILL HERE", "LOOK BACK"]);

    const t = new DynamicTexture("anomaly.writing.tex", { width: 512, height: 256 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.clearRect(0, 0, 512, 256);
    c.font = "600 72px 'Courier New', monospace";
    c.fillStyle = "rgba(228,232,230,0.88)";
    c.textAlign = "center";
    c.textBaseline = "middle";
    // fingered-in-condensation wobble: draw each glyph with jitter
    const chars = word.split("");
    const spacing = 52;
    const x0 = 256 - ((chars.length - 1) * spacing) / 2;
    chars.forEach((ch, i) => {
      const jx = (rng.range(-1, 1) * 5) | 0;
      const jy = (rng.range(-1, 1) * 8) | 0;
      const rot = rng.range(-0.09, 0.09);
      c.save();
      c.translate(x0 + i * spacing + jx, 128 + jy);
      c.rotate(rot);
      c.fillText(ch, 0, 0);
      c.restore();
    });
    t.update();

    const mat = new StandardMaterial("anomaly.writing.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    mat.opacityTexture = t;
    mat.disableLighting = true;
    mat.backFaceCulling = false;

    const z = rng.range(23, 29);
    const p = CreatePlane("anomaly.writing", { width: 1.4, height: 0.7 }, scene);
    p.material = mat;
    p.position = new Vector3(1.735 - 0.005, 1.62, z);
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
