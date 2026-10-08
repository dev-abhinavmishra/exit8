/**
 * sign.fallen — the ROUTE DIRECTORY sign is off its mounts. A clean
 * ghost rectangle hangs where it was (darker border, two bare screw
 * holes) and the slab itself leans against the wall at your feet,
 * face still readable at a tilt. Loud object-class anomaly.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef, AnomalyInstance } from "./types";

const SPEC_ID = "sign.directory";
const SIGN_X = LAYOUT.corridor.xHalf - 0.06;
const SIGN_Y = 1.86;
const SIGN_Z = 10.9;
const SIGN_W = 1.3;
const SIGN_H = 0.34;

export const signFallen: AnomalyDef = {
  id: "sign.fallen",
  displayName: "Directory Sign Off the Wall",
  chapter: 2,
  category: "object",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign"],
  testSeed: "test.sign.fallen",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const mounted = world.registry.mesh(`sign.${SPEC_ID}`);
    if (!spec || !mounted) return { update() {}, cleanup() {} };
    mounted.setEnabled(false);

    // ghost rectangle where it hung — a shade cleaner than the wall,
    // with two bare screw holes
    const ghostTex = new DynamicTexture("anomaly.signfallen.ghost", { width: 256, height: 72 }, scene, true);
    const gc = ghostTex.getContext() as unknown as CanvasRenderingContext2D;
    gc.fillStyle = "rgba(226,224,214,0.55)";
    gc.fillRect(0, 0, 256, 72);
    gc.strokeStyle = "rgba(60,58,50,0.5)";
    gc.lineWidth = 3;
    gc.strokeRect(2, 2, 252, 68);
    gc.fillStyle = "rgba(30,28,24,0.85)";
    for (const hx of [24, 232]) {
      gc.beginPath();
      gc.arc(hx, 14, 4, 0, Math.PI * 2);
      gc.fill();
    }
    ghostTex.update();
    const ghostMat = new StandardMaterial("anomaly.signfallen.ghostmat", scene);
    ghostMat.diffuseTexture = ghostTex;
    ghostMat.opacityTexture = ghostTex;
    ghostMat.emissiveTexture = ghostTex;
    ghostMat.emissiveColor = new Color3(0.12, 0.12, 0.12);
    ghostMat.specularColor = Color3.Black();
    const ghost = CreatePlane("anomaly.signfallen.ghost", { width: SIGN_W, height: SIGN_H }, scene);
    ghost.material = ghostMat;
    ghost.parent = world.root;
    ghost.position = new Vector3(SIGN_X, SIGN_Y, SIGN_Z);
    ghost.rotation.y = Math.PI / 2;

    // the slab leaning at the wall base, face toward the corridor
    const parent = new TransformNode("anomaly.signfallen.slab", scene);
    parent.parent = world.root;
    parent.position = new Vector3(SIGN_X - 0.055, 0.005, SIGN_Z + ctx.rng.range(-0.3, 0.3));
    parent.rotation.y = ctx.rng.range(-0.06, 0.06);
    const faceTex = new DynamicTexture("anomaly.signfallen.face", { width: 512, height: 136 }, scene, true);
    drawSign(faceTex, spec);
    const faceMat = new StandardMaterial("anomaly.signfallen.facemat", scene);
    faceMat.diffuseTexture = faceTex;
    faceMat.emissiveTexture = faceTex;
    faceMat.emissiveColor = new Color3(0.3, 0.3, 0.3);
    faceMat.specularColor = Color3.Black();
    faceMat.backFaceCulling = false;
    const slab = CreatePlane("anomaly.signfallen.face", { width: SIGN_W, height: SIGN_H }, scene);
    slab.material = faceMat;
    slab.parent = parent;
    slab.position = new Vector3(0, SIGN_H / 2 - 0.02, 0);
    slab.rotation.y = Math.PI / 2;
    slab.rotation.x = -0.3; // top edge rests against the wall

    return {
      update() {},
      cleanup() {
        parent.dispose(false, true);
        ghost.dispose();
        mounted.setEnabled(true);
      },
    };
  },
};
