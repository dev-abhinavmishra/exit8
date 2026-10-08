/**
 * face.pane.north — the divergence-side mirror of face.pane: a pale
 * eyeless face waits in the north inner door's vision pane while you
 * walk up to file a divergence, and slides into the jamb with the
 * leaf when the doors part. Unmistakable.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawFace } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const facePaneNorth: AnomalyDef = {
  id: "face.pane.north",
  displayName: "Face in the North Pane",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [30, 100],
  requires: ["door.north.inner.R"],
  excludes: ["face.pane", "figure.north", "watcher.follows"],
  testSeed: "test.face.pane.north",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    const leaf = ctx.world.registry.mesh("door.north.inner.R");
    if (!leaf) return { update() {}, cleanup() {} };

    const t = new DynamicTexture("anomaly.facepaneN.tex", { width: 256, height: 320 }, scene, true);
    drawFace(t, "eyeless");
    const mat = new StandardMaterial("anomaly.facepaneN.mat", scene);
    mat.diffuseTexture = t;
    mat.opacityTexture = t;
    mat.emissiveTexture = t;
    mat.emissiveColor = new Color3(0.28, 0.28, 0.28);
    mat.specularColor = Color3.Black();
    mat.backFaceCulling = false;

    const face = CreatePlane("anomaly.facepaneN", { width: 0.17, height: 0.28 }, scene);
    face.material = mat;
    face.parent = leaf;
    // north door: corridor lies at +z of the leaf, so the face rides
    // the +z face of the pane and looks north up the corridor
    face.position.set(0, 0.395, 0.07);
    return {
      update() {},
      cleanup() {
        face.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
