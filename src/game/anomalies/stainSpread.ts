/**
 * stain.spread — a spill has crept out from under the records wall
 * onto the terrazzo. Dark, still-edged, too wide to have happened
 * between loops. It dries matte under the troffers.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const stainSpread: AnomalyDef = {
  id: "stain.spread",
  displayName: "The Spill",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["floor"],
  excludes: ["stain"],
  testSeed: "test.stain.spread",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const mat = new StandardMaterial("anomaly.stain.mat", scene);
    mat.diffuseColor = new Color3(0.06, 0.055, 0.05);
    mat.specularColor = new Color3(0.02, 0.02, 0.02);
    const s = CreateBox(
      "anomaly.stain",
      {
        width: rng.range(0.9, 1.4),
        height: 0.006,
        depth: rng.range(0.7, 1.1),
      },
      scene,
    );
    s.material = mat;
    s.position = new Vector3(rng.range(-1.1, -0.5), 0.004, rng.range(14, 40));
    s.rotation.y = rng.range(-0.3, 0.3);
    s.parent = world.root;
    return {
      update() {},
      cleanup() {
        s.dispose();
        mat.dispose();
      },
    };
  },
};
