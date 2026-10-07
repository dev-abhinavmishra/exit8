/**
 * counter.worker — under the clinic shutter, a dark hand slides a slip of
 * paperwork out onto the counter, holds, and draws back. Moderate —
 * unmistakable if you're facing the counter when it moves.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

const Z = 37;
const OUT_S = 3.2;
const HOLD_S = 3.4;
const BACK_S = 1.6;
const REST_S = 7;

export const counterWorker: AnomalyDef = {
  id: "counter.worker",
  displayName: "Hand Under the Shutter",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["clinic.shutter", "clinic.counter"],
  excludes: ["figure"],
  testSeed: "test.counter.worker",
  dangerous: false,
  activate(ctx) {
    const scene = ctx.scene;
    const g = new TransformNode("anomaly.worker", scene);
    g.parent = ctx.world.root;

    // the slip — pale paper riding the counter top
    const paperMat = new StandardMaterial("anomaly.worker.paper.mat", scene);
    paperMat.diffuseColor = new Color3(0.84, 0.81, 0.74);
    paperMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const paper = CreatePlane("anomaly.worker.paper", { width: 0.2, height: 0.28 }, scene);
    paper.material = paperMat;
    paper.rotation.x = Math.PI / 2;
    paper.parent = g;

    // the hand — flattened dark form just clear of the shutter line,
    // with a wrist cuff trailing under the shutter and finger hints so
    // it reads as a hand, not a slab
    const hand = CreateBox("anomaly.worker.hand", { width: 0.09, height: 0.03, depth: 0.15 }, scene);
    hand.material = ctx.world.materials.rubber;
    hand.parent = g;
    const cuff = CreateBox("anomaly.worker.cuff", { width: 0.085, height: 0.05, depth: 0.1 }, scene);
    cuff.material = ctx.world.materials.rubber;
    cuff.parent = g;
    const fingers: AbstractMesh[] = [];
    for (let i = 0; i < 4; i++) {
      const f = CreateBox(`anomaly.worker.finger.${i}`, { width: 0.016, height: 0.018, depth: 0.05 }, scene);
      f.material = ctx.world.materials.rubber;
      f.parent = g;
      fingers.push(f);
    }

    const IN_X = -1.62; // tucked under the shutter
    const OUT_X = -1.3; // slid out onto the counter top
    const Y = 1.055;
    const cycle = OUT_S + HOLD_S + BACK_S + REST_S;
    let tS = -2; // small delay before first emergence
    const place = (x: number) => {
      paper.position.set(x, Y, Z);
      hand.position.set(x - 0.12, Y + 0.02, Z);
      // cuff trails the wrist under the shutter; fingertips lead in
      // the direction of travel (+x — the slide is along the counter)
      cuff.position.set(x - 0.23, Y + 0.005, Z);
      fingers.forEach((f, i) => {
        f.position.set(x - 0.03, Y + 0.012, Z + (i - 1.5) * 0.02);
        f.rotation.y = Math.PI / 2;
      });
    };
    place(IN_X);

    let captioned = false;
    const cycleT = cycle - REST_S; // motion occupies the front of the cycle
    return {
      update(dt) {
        tS += dt;
        const k = ((tS % cycle) + cycle) % cycle;
        if (k < OUT_S) {
          const e = (k / OUT_S) ** 0.6;
          place(IN_X + (OUT_X - IN_X) * e);
          g.setEnabled(true);
          if (!captioned && k > 0.4) {
            captioned = true;
            ctx.audio.caption("paper slides", new Vector3(OUT_X, Y, Z));
          }
        } else if (k < OUT_S + HOLD_S) {
          place(OUT_X);
        } else if (k < cycleT) {
          const e = (k - OUT_S - HOLD_S) / BACK_S;
          place(OUT_X + (IN_X - OUT_X) * e * e);
        } else {
          g.setEnabled(false); // hand withdraws fully between passes
          captioned = false;
        }
      },
      cleanup() {
        g.dispose(false, true);
        paperMat.dispose();
      },
    };
  },
};
