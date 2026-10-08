/**
 * cable.hangs — a cable is down from the ceiling tray, hanging in a
 * loose J into headroom and swaying very slightly, like it parted a
 * moment ago. Nothing else in the corridor hangs. Moderate: it is in
 * your eye line, but thin and dark and easy to walk under.
 */
import { CreateTube } from "@babylonjs/core/Meshes/Builders/tubeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

export const cableHangs: AnomalyDef = {
  id: "cable.hangs",
  displayName: "Cable Down",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: ["floor"],
  excludes: ["ceiling", "light.follows", "light.out"],
  testSeed: "test.cable.hangs",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const side = rng.draw() < 0.5 ? -1 : 1;
    const z = rng.range(12, 46);
    // tray runs along the ceiling edge; the cable parts from its lip
    const anchor = new TransformNode("anomaly.cable.pivot", scene);
    anchor.parent = world.root;
    anchor.position.set(side * 1.52, 2.9, z);
    // J-curve: off the tray lip, drooping low, curling at the cut end
    const sway = rng.range(0.3, 0.6) * (rng.draw() < 0.5 ? -1 : 1);
    const path = [
      new Vector3(0.04 * side, 0.02, -0.35),
      new Vector3(0.02 * side, -0.06, -0.15),
      new Vector3(0, -0.5, 0.02),
      new Vector3(-0.05 * side, -0.85, 0.08),
      new Vector3(0.03 * side, -1.02, 0.14),
      new Vector3(0.09 * side, -0.98, 0.18),
    ];
    const mat = new StandardMaterial("anomaly.cable.mat", scene);
    mat.diffuseColor = new Color3(0.07, 0.07, 0.08);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    const tube = CreateTube("anomaly.cable", { path, radius: 0.012, tessellation: 8 }, scene);
    tube.material = mat;
    tube.parent = anchor;
    let t = rng.range(0, Math.PI * 2);
    const swayAmp = 0.045 + sway * 0.02;
    return {
      update(dt) {
        t += dt;
        // pendulum sway, still settling — never fully still
        anchor.rotation.z = Math.sin(t * 1.1) * swayAmp;
        anchor.rotation.x = Math.sin(t * 0.7 + 1.3) * swayAmp * 0.5;
      },
      cleanup() {
        tube.dispose();
        mat.dispose();
        anchor.dispose();
      },
    };
  },
};
