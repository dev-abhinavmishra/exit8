/**
 * face.pane — a face waits in the south inner door's wired-glass
 * vision pane, pale against the dark airlock behind it, staring up the
 * corridor at eye height. It is parented to the leaf, so when the
 * doors part for your commit walk the face slides into the jamb with
 * the leaf — and nothing is there. Unmistakable.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawFace } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const facePane: AnomalyDef = {
  id: "face.pane",
  displayName: "Face in the Vision Pane",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [30, 100],
  requires: ["door.south.inner.L"],
  excludes: ["figure.south", "watcher.follows"],
  testSeed: "test.face.pane",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    const leaf = ctx.world.registry.mesh("door.south.inner.L");
    if (!leaf) return { update() {}, cleanup() {} };

    const t = new DynamicTexture("anomaly.facepane.tex", { width: 256, height: 320 }, scene, true);
    drawFace(t, "eyeless");
    const mat = new StandardMaterial("anomaly.facepane.mat", scene);
    mat.diffuseTexture = t;
    mat.opacityTexture = t;
    mat.emissiveTexture = t;
    mat.emissiveColor = new Color3(0.28, 0.28, 0.28);
    mat.specularColor = Color3.Black();
    mat.backFaceCulling = false;

    const face = CreatePlane("anomaly.facepane", { width: 0.17, height: 0.28 }, scene);
    face.material = mat;
    face.parent = leaf;
    // leaf-local: pane sits at +0.395 over the leaf origin (world y 1.72).
    // The wired glass is an opaque slab — the face reads on the pane's
    // corridor face, a few mm proud of the laminate wires
    face.position.set(0, 0.395, -0.07);
    face.rotation.y = Math.PI; // look out of the glass toward the corridor

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
