/**
 * vend.dispensed — the cold-dispense machine vended for nobody. One can
 * sits half-out of the retrieval flap; a second lies on the terrazzo
 * at the machine's feet, rolled a short way and abandoned. Moderate.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef, AnomalyInstance } from "./types";

const VEND_X = LAYOUT.corridor.xHalf - 0.36;
const VEND_Z = 41.5;

export const vendDispensed: AnomalyDef = {
  id: "vend.dispensed",
  displayName: "Cans Dispensed for Nobody",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [10, 100],
  requires: ["prop.vending"],
  excludes: ["vend.dead", "vend.empty"],
  testSeed: "test.vend.dispensed",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const canMat = new StandardMaterial("anomaly.vend.can.mat", scene);
    const tone = rng.pick([
      new Color3(0.5, 0.1, 0.1),
      new Color3(0.1, 0.35, 0.38),
      new Color3(0.16, 0.18, 0.2),
    ]);
    canMat.diffuseColor = tone;
    canMat.emissiveColor = tone.scale(0.35);
    canMat.specularColor = Color3.Black();

    // half-dropped in the flap pocket (texture coords: flap ~y0.39, z-centre)
    const flapCan = CreateCylinder("anomaly.vend.can.flap", { diameter: 0.062, height: 0.115 }, scene);
    flapCan.material = canMat;
    flapCan.parent = world.root;
    flapCan.position = new Vector3(VEND_X - 0.28, 0.41, VEND_Z - 0.06);
    flapCan.rotation.z = Math.PI / 2 - 0.25; // nose-down, still in the pocket
    flapCan.rotation.x = rng.range(-0.15, 0.15);

    // the one that rolled away and nobody picked up
    const floorCan = CreateCylinder("anomaly.vend.can.floor", { diameter: 0.062, height: 0.115 }, scene);
    floorCan.material = canMat;
    floorCan.parent = world.root;
    floorCan.position = new Vector3(VEND_X - rng.range(0.5, 0.75), 0.033, VEND_Z + rng.range(-0.4, 0.2));
    floorCan.rotation.x = Math.PI / 2;
    floorCan.rotation.y = rng.range(0, Math.PI);

    return {
      update() {},
      cleanup() {
        flapCan.dispose();
        floorCan.dispose();
        canMat.dispose();
      },
    };
  },
};
