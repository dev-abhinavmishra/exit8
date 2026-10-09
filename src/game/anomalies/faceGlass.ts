/**
 * face.glass — a face is pressed to the gallery glass from inside the
 * dark reading room. Pale and eyeless, just behind the smoked pane,
 * looking out at the corridor. It is only there when you look for it;
 * approach the glass and it slides back into the dark. Unmistakable
 * at close range.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { drawFace } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const GLASS_X = 1.8; // corridor face of the gallery slab
const FACE_X = 1.95; // just inside the dark room

export const faceGlass: AnomalyDef = {
  id: "face.glass",
  displayName: "Face at the Glass",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [30, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery.occupied", "gallery.frost", "glass.eyes", "glass.hands", "blinds.open", "gallery.door"],
  testSeed: "test.face.glass",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const t = new DynamicTexture("anomaly.faceglass.tex", { width: 256, height: 320 }, scene, true);
    drawFace(t, "eyeless");
    const mat = new StandardMaterial("anomaly.faceglass.mat", scene);
    mat.diffuseTexture = t;
    mat.opacityTexture = t;
    mat.emissiveTexture = t;
    mat.emissiveColor = new Color3(0.34, 0.34, 0.34); // dimmer than the panes — behind smoked glass
    mat.specularColor = Color3.Black();
    mat.backFaceCulling = false;

    const face = CreatePlane("anomaly.faceglass", { width: 0.22, height: 0.34 }, scene);
    face.material = mat;
    face.parent = world.root;
    const z = rng.range(22, 30);
    face.position = new Vector3(FACE_X, rng.range(1.45, 1.62), z);
    face.rotation.y = -Math.PI / 2; // looking west through the glass
    let pulled = false;
    return {
      update(dt) {
        if (pulled) return;
        const p = ctx.player.position;
        // close inspection — nearer than ~1.4m from the pane — sends it back
        const near = Math.abs(p.z - z) < 1.3 && Math.abs(p.x - GLASS_X) < 1.4 && p.x > GLASS_X - 1.6;
        if (near) {
          const v = face.position;
          v.x += dt * 0.9;
          if (v.x > 2.6) {
            pulled = true;
            face.setEnabled(false);
            ctx.audio.caption("it pulled back into the dark", null);
          }
        }
      },
      cleanup() {
        face.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
