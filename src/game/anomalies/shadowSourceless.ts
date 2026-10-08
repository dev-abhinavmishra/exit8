/**
 * shadow.sourceless — a soft dark ellipse glides across the clinic floor,
 * left to right, as if someone passed an opening that isn't there.
 * Moderate.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const CROSS_Z = 40;
const SWEEP_S = 7;
const HOLD_S = 4;

export const shadowSourceless: AnomalyDef = {
  id: "shadow.sourceless",
  displayName: "Caster-less Shadow",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["light.zone.clinic"],
  excludes: ["zone.clinic", "floor.shadow"],
  testSeed: "test.shadow.sourceless",
  dangerous: false,
  activate(ctx) {
    const scene = ctx.scene;
    const t = new DynamicTexture("anomaly.shadow.tex", { width: 128, height: 128 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    const g = c.createRadialGradient(64, 64, 6, 64, 64, 60);
    g.addColorStop(0, "rgba(8,8,10,0.85)");
    g.addColorStop(0.6, "rgba(8,8,10,0.4)");
    g.addColorStop(1, "rgba(8,8,10,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    t.update();
    t.hasAlpha = true;
    const mat = new StandardMaterial("anomaly.shadow.mat", scene);
    mat.diffuseTexture = t;
    mat.opacityTexture = t;
    mat.disableLighting = true;
    mat.specularColor = new Color3(0, 0, 0);
    const blob = CreatePlane("anomaly.shadow", { width: 1.5, height: 2.2 }, scene);
    blob.material = mat;
    blob.rotation.x = Math.PI / 2; // lie flat on the floor
    blob.position = new Vector3(-1.5, 0.025, CROSS_Z);

    let tS = -1.5; // small lead-in
    const cycle = SWEEP_S + HOLD_S;
    return {
      update(dt) {
        tS = (tS + dt) % cycle;
        if (tS < SWEEP_S) {
          const k = tS / SWEEP_S;
          const e = k * k * (3 - 2 * k); // smoothstep — enters slow, crosses, exits slow
          blob.position.x = -1.5 + 3.0 * e;
          blob.isVisible = true;
        } else {
          blob.isVisible = false;
        }
      },
      cleanup() {
        blob.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
