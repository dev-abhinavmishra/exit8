/**
 * gallery.lit — for the first time, the observation room behind the
 * dark glass has its lights on. An empty lit office watching the
 * corridor. Nobody is in it — that you can see.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef } from "./types";

export const galleryLit: AnomalyDef = {
  id: "gallery.lit",
  displayName: "Gallery Lights On",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["wall.gallery.glass", "wall.gallery.back"],
  excludes: ["gallery"],
  testSeed: "test.gallery.lit",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    // the dark glass kills any real light placed behind it — so the lit
    // room is drawn: a warm back wall and a ceiling strip, both emissive
    const litMat = new StandardMaterial("anomaly.gallery.litmat", scene);
    litMat.diffuseColor = new Color3(0.55, 0.5, 0.4);
    litMat.emissiveColor = new Color3(0.5, 0.44, 0.32);
    litMat.disableLighting = true;
    const back = CreateBox("anomaly.gallery.backlit", { width: 0.05, height: 2.4, depth: 11 }, scene);
    back.material = litMat;
    back.position = new Vector3(3.05, 1.5, 26);
    back.parent = world.root;
    const ceil = CreateBox("anomaly.gallery.ceil", { width: 0.5, height: 0.06, depth: 9 }, scene);
    ceil.material = litMat;
    ceil.position = new Vector3(2.4, 2.62, 26);
    ceil.parent = world.root;
    const desk = CreateBox("anomaly.gallery.desk", { width: 0.5, height: 0.75, depth: 2.2 }, scene);
    desk.material = world.materials.steel;
    desk.position = new Vector3(2.45, 0.38, 24 + rng.range(0, 4));
    desk.parent = world.root;

    return {
      update() {},
      cleanup() {
        back.dispose();
        ceil.dispose();
        desk.dispose();
        litMat.dispose();
      },
    };
  },
};
