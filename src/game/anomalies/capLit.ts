/**
 * cap.lit — a band of warm light bleeds under the sealed south cap,
 * the door every clear filing walks toward. Whatever is back there is
 * lit like day. Subtle: only reads at the commit walk's last metres.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

// the south cap sits at the vestibule's far wall (z≈60); the slit glows
// on its corridor face — only readable in the commit walk's last metres
const SLIT_Z = 59.93;
const GLOW = new Vector3(0, 0.4, 59.4);

export const capLit: AnomalyDef = {
  id: "cap.lit",
  displayName: "Light Under the Door",
  chapter: 1,
  category: "lighting",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["al.south.cap"],
  excludes: ["airlock.breach", "doors.open", "doors.slam", "door.stuck"],
  testSeed: "test.cap.lit",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const mat = new StandardMaterial("anomaly.caplit.mat", ctx.scene);
    mat.diffuseColor = new Color3(0.5, 0.42, 0.28);
    mat.emissiveColor = new Color3(1.0, 0.88, 0.62);
    mat.specularColor = Color3.Black();
    const slit = CreatePlane("anomaly.caplit.slit", { width: 2.9, height: 0.07 }, ctx.scene);
    slit.material = mat;
    slit.rotation.y = Math.PI; // plane faces −z at rest — face the approach, north
    slit.position.set(0, 0.045, SLIT_Z);
    // and the floor pool it would throw a hand's width in front
    const glow = new PointLight("anomaly.caplit.glow", GLOW, ctx.scene);
    glow.diffuse = new Color3(1.0, 0.88, 0.62);
    glow.intensity = 0.55;
    glow.range = 3.8;
    return {
      update() {},
      cleanup() {
        glow.dispose();
        slit.dispose();
        mat.dispose();
      },
    };
  },
};
