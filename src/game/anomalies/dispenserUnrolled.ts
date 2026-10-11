import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * dispenser.unrolled — the paper-towel dispenser has given up its
 * roll: a tongue of towel hangs from the slit all the way to the
 * floor beside the bin, a loose curl of sheets piled at the foot.
 */
export const dispenserUnrolled: AnomalyDef = {
  id: "dispenser.unrolled",
  displayName: "The Whole Roll",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [5, 100],
  requires: ["wash.dispenser", "wash.dispenser.slit"],
  excludes: [],
  testSeed: "test.dispenser.unrolled",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const slit = scene.getMeshByName("wash.dispenser.slit");
    if (!slit) return { update() {}, cleanup() {} };
    const p = slit.absolutePosition;
    const paperMat = new StandardMaterial("mat.dispenser.paper", scene);
    paperMat.diffuseColor = new Color3(0.86, 0.85, 0.8);
    paperMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const tongue = CreateBox("anomaly.dispenser.tongue", { width: 0.02, height: 1.0, depth: 0.16 }, scene);
    tongue.material = paperMat;
    tongue.parent = world.root;
    tongue.position = new Vector3(p.x, p.y - 0.52, p.z);
    tongue.rotation.x = 0.04; // hangs a hair off true
    const curl = CreateBox("anomaly.dispenser.curl", { width: 0.3, height: 0.05, depth: 0.24 }, scene);
    curl.material = paperMat;
    curl.parent = world.root;
    curl.position = new Vector3(p.x + 0.04, 0.025, p.z + 0.06);
    curl.rotation.y = 0.35;
    return {
      update() {},
      cleanup() {
        scene.getMeshByName("anomaly.dispenser.tongue")?.dispose();
        scene.getMeshByName("anomaly.dispenser.curl")?.dispose();
        paperMat.dispose();
      },
    };
  },
};
