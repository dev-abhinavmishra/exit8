/**
 * door.lit — warm light leaks around the service door's south edge.
 * The door stays shut, but someone left a light on in there — or
 * someone is in there. Moderate object-class anomaly.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const doorLit: AnomalyDef = {
  id: "door.lit",
  displayName: "Light in the Service Room",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["service.door.slit"],
  excludes: ["door.ajar", "door.breathes"],
  testSeed: "test.door.lit",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const spawned: { dispose(): void }[] = [];

    const lit = new StandardMaterial("anomaly.doorlit.mat", scene);
    lit.diffuseColor = new Color3(0.9, 0.78, 0.52);
    lit.emissiveColor = new Color3(0.5, 0.38, 0.2);
    lit.specularColor = new Color3(0, 0, 0);

    // a sliver of warm light in the reveal beside the leaf's south edge
    const sliver = CreatePlane("anomaly.doorlit.sliver", { width: 0.05, height: 2.0 }, scene);
    sliver.material = lit;
    sliver.rotation.y = Math.PI / 2; // corridor-facing (−x side)
    sliver.position = new Vector3(1.59, 1.05, 15.93);
    sliver.parent = world.root;
    spawned.push(sliver);

    // warm wash spilling under the door onto the floor
    const spill = CreatePlane("anomaly.doorlit.spill", { width: 0.9, height: 0.8 }, scene);
    spill.material = world.materials.lightShaft;
    spill.rotation.x = -Math.PI / 2;
    spill.position = new Vector3(1.3, 0.015, 15.5);
    spill.parent = world.root;
    spawned.push(spill);

    return {
      update() {},
      cleanup() {
        for (const s of spawned) s.dispose();
        lit.dispose();
      },
    };
  },
};
