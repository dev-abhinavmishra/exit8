/**
 * mop.bucket — a mop leaning against the east wall and a bucket at
 * its base, abandoned mid-shift. Nobody cleans this loop; the route
 * keeps no cleaning kit. An object where the corridor holds none —
 * the sort of thing you'd walk past once and doubt twice.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const mopBucket: AnomalyDef = {
  id: "mop.bucket",
  displayName: "Cleaning Kit",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [0, 100],
  requires: ["wall.right.2"],
  excludes: [],
  testSeed: "test.mop.bucket",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const n = new TransformNode("anomaly.mop", scene);
    n.parent = world.root;
    // west wall, the dim run past the cabinets and before the
    // junction mouth — floor is bare here on a normal loop
    const z = rng.range(49.5, 52);
    n.position = new Vector3(-1.48, 0, z); // a hand's width off the wall
    n.rotation.y = Math.PI; // mirror the lean against the west wall
    const plastic = new StandardMaterial("anomaly.mop.plastic", scene);
    plastic.diffuseColor = new Color3(0.4, 0.46, 0.52); // pale work bucket
    plastic.specularColor = new Color3(0.08, 0.08, 0.08);
    plastic.emissiveColor = new Color3(0.02, 0.024, 0.028); // readable in the dim run
    const wood = new StandardMaterial("anomaly.mop.wood", scene);
    wood.diffuseColor = new Color3(0.5, 0.4, 0.26); // worn handle
    const rag = new StandardMaterial("anomaly.mop.rag", scene);
    rag.diffuseColor = new Color3(0.7, 0.68, 0.62); // off-white mop strands
    rag.emissiveColor = new Color3(0.03, 0.03, 0.026);
    // bucket — slightly tapered cylinder with a dark water fill
    const bucket = CreateCylinder(
      "anomaly.mop.bucket",
      { height: 0.24, diameterTop: 0.3, diameterBottom: 0.24, tessellation: 14 },
      scene,
    );
    bucket.material = plastic;
    bucket.parent = n;
    bucket.position = new Vector3(0, 0.12, 0.22);
    const water = CreateCylinder(
      "anomaly.mop.water",
      { height: 0.01, diameter: 0.26, tessellation: 14 },
      scene,
    );
    const waterMat = new StandardMaterial("anomaly.mop.water.mat", scene);
    waterMat.diffuseColor = new Color3(0.06, 0.07, 0.08);
    waterMat.specularColor = new Color3(0.4, 0.4, 0.45); // still water sheen
    water.material = waterMat;
    water.parent = n;
    water.position = new Vector3(0, 0.225, 0.22);
    // mop — long handle leaning to the wall, strand head on the floor
    const handle = CreateCylinder(
      "anomaly.mop.handle",
      { height: 1.42, diameter: 0.03, tessellation: 8 },
      scene,
    );
    handle.material = wood;
    handle.parent = n;
    handle.position = new Vector3(0.02, 0.72, -0.05);
    handle.rotation.z = 0.24;
    handle.rotation.x = -0.1;
    const head = CreateCylinder(
      "anomaly.mop.head",
      { height: 0.16, diameter: 0.11, tessellation: 10 },
      scene,
    );
    head.material = rag;
    head.parent = n;
    head.position = new Vector3(-0.12, 0.08, -0.02);
    // a few loose strands pooling at the base
    for (let i = 0; i < 3; i++) {
      const strand = CreateBox(`anomaly.mop.strand.${i}`, { width: 0.16, height: 0.015, depth: 0.03 }, scene);
      strand.material = rag;
      strand.parent = n;
      strand.position = new Vector3(-0.12 + i * 0.02, 0.012, -0.02 + i * 0.035);
      strand.rotation.y = rng.range(-0.6, 0.6);
    }
    return {
      update() {},
      cleanup() {
        n.dispose();
        plastic.dispose();
        wood.dispose();
        rag.dispose();
        waterMat.dispose();
      },
    };
  },
};
