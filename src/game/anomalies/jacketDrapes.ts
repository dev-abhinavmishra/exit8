/**
 * jacket.drapes — a work jacket lies folded over the mid-corridor
 * bench, collar roll up, one sleeve hanging off the edge. Nobody sits
 * here on this route; the inspector who patrols wears a coat, not
 * this. An object where the loop keeps none.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

export const jacketDrapes: AnomalyDef = {
  id: "jacket.drapes",
  displayName: "Jacket On The Bench",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [0, 100],
  requires: ["bench.south"],
  excludes: ["bench.moved", "bench.flipped", "bench.sit", "bench.gone", "benchSit"],
  testSeed: "test.jacket.drapes",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const bench = world.registry.get("bench.south");
    const mat = new StandardMaterial("anomaly.jacket.mat", scene);
    mat.diffuseColor = new Color3(0.055, 0.06, 0.085); // dark navy work jacket
    mat.specularColor = new Color3(0, 0, 0); // cloth — kill the troffer sheen
    mat.emissiveColor = new Color3(0.012, 0.013, 0.02); // readable, never washed
    const n = new TransformNode("anomaly.jacket", scene);
    n.parent = bench;
    // seat top is y 0.45; the lump rides just off-centre
    n.position.set(0.18, 0.5, 0.01);
    const body = CreateBox("anomaly.jacket.body", { width: 0.46, height: 0.1, depth: 0.32 }, scene);
    body.material = mat;
    body.parent = n;
    body.rotation.y = 0.24;
    // collar roll along the top edge
    const collar = CreateCylinder(
      "anomaly.jacket.collar",
      { height: 0.34, diameter: 0.06, tessellation: 10 },
      scene,
    );
    collar.material = mat;
    collar.parent = n;
    collar.rotation.z = Math.PI / 2;
    collar.rotation.y = 0.24;
    collar.position.set(0.03, 0.05, -0.12);
    // one sleeve hangs off the seat edge
    const sleeve = CreateBox("anomaly.jacket.sleeve", { width: 0.11, height: 0.24, depth: 0.09 }, scene);
    sleeve.material = mat;
    sleeve.parent = n;
    sleeve.position.set(-0.24, -0.06, 0.08);
    sleeve.rotation.x = 0.35;
    sleeve.rotation.z = 0.15;
    return {
      update() {},
      cleanup() {
        body.dispose();
        collar.dispose();
        sleeve.dispose();
        mat.dispose();
        n.dispose();
      },
    };
  },
};
