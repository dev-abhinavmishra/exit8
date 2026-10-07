/**
 * glass.eyes — something paces the observation gallery behind the
 * glass. A tall dim shape slides the length of the panes, pauses at
 * the far end as if checking the roster, and slides back. Nobody has
 * gallery access on this shift.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const X = 2.05; // behind the glass plane (right wall inner ~1.74)
const Z0 = 21;
const Z1 = 31;
const SPEED = 0.35;
const PAUSE_S = 6;

export const glassEyes: AnomalyDef = {
  id: "glass.eyes",
  displayName: "Someone In The Gallery",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery", "figure", "watcher.follows"],
  testSeed: "test.glass.eyes",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const fig = new TransformNode("anomaly.glassfig", scene);
    fig.parent = world.root;
    // barely-lit silhouette: dark rubber with a faint cold lift so the
    // shape reads through the 0.45-alpha dark glass without glowing
    const mat = new StandardMaterial("anomaly.glassfig.mat", scene);
    mat.diffuseColor = new Color3(0.02, 0.02, 0.03);
    mat.emissiveColor = new Color3(0.05, 0.055, 0.07);
    const body = CreateBox("anomaly.glassfig.body", { width: 0.44, height: 1.72, depth: 0.24 }, scene);
    body.material = mat;
    body.position = new Vector3(0, 0.86, 0);
    body.parent = fig;
    const head = CreateBox("anomaly.glassfig.head", { width: 0.2, height: 0.26, depth: 0.2 }, scene);
    head.material = mat;
    head.position = new Vector3(0, 1.85, 0);
    head.parent = fig;
    fig.position.set(X, 0, Z0);

    let z = Z0;
    let dir = 1;
    let pauseT = 0;

    return {
      update(dt) {
        if (pauseT > 0) {
          pauseT -= dt;
          return;
        }
        z += dir * SPEED * dt;
        if (z >= Z1) {
          z = Z1;
          dir = -1;
          pauseT = PAUSE_S;
        } else if (z <= Z0) {
          z = Z0;
          dir = 1;
          pauseT = PAUSE_S;
        }
        fig.position.z = z;
      },
      cleanup() {
        fig.dispose(false, true);
        mat.dispose();
      },
    };
  },
};
