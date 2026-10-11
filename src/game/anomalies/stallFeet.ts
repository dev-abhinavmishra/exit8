import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * stall.feet — whoever shut the stall door never left. Under the
 * partition gap: two trouser cuffs and shoe toes planted on the tile.
 * Unmistakable once your eye falls under the stall.
 */
export const stallFeet: AnomalyDef = {
  id: "stall.feet",
  displayName: "He Never Left",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["wash.stall.door.1"],
  excludes: ["stall.occupied"],
  testSeed: "test.stall.feet",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const door = world.registry.get("wash.stall.door.1");
    const baseYaw = door.rotation.y;
    // shut the stall's door so the feet read as a closed stall
    door.rotation.y = 0;
    const pantMat = new StandardMaterial("mat.stall.cuff", scene);
    pantMat.diffuseColor = new Color3(0.1, 0.1, 0.12);
    const shoeMat = new StandardMaterial("mat.stall.shoe", scene);
    shoeMat.diffuseColor = new Color3(0.05, 0.045, 0.04);
    const doorPos = door.absolutePosition ?? door.position;
    const parts: string[] = [];
    for (const [dx, tag] of [
      [-0.12, "l"],
      [0.13, "r"],
    ] as const) {
      const shin = CreateBox(`anomaly.stall.shin.${tag}`, { width: 0.09, height: 0.34, depth: 0.1 }, scene);
      shin.material = pantMat;
      shin.parent = world.root;
      shin.position = new Vector3(doorPos.x + dx, 0.17, doorPos.z + 0.16);
      const shoe = CreateBox(`anomaly.stall.shoe.${tag}`, { width: 0.1, height: 0.055, depth: 0.24 }, scene);
      shoe.material = shoeMat;
      shoe.parent = world.root;
      shoe.position = new Vector3(doorPos.x + dx, 0.028, doorPos.z + 0.2);
      parts.push(shin.name, shoe.name);
    }
    return {
      update() {},
      cleanup() {
        door.rotation.y = baseYaw;
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        pantMat.dispose();
        shoeMat.dispose();
      },
    };
  },
};
