import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * ceil.cord — the panel is slid aside and a pull-cord hangs out of
 * the plenum mouth to head height, swaying gently on a draft that
 * isn't there. Unmistakable at the fixture.
 */
export const ceilCord: AnomalyDef = {
  id: "ceil.cord",
  displayName: "The Cord Hangs Down",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["ceil.panel"],
  excludes: ["ceil.ajar", "ceil.fallen", "ceil.lit"],
  testSeed: "test.ceil.cord",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const panel = scene.getTransformNodeByName("ceil.panel");
    if (!panel) return { update() {}, cleanup() {} };
    panel.position.z = 0.34;
    const cordMat = new StandardMaterial("mat.ceil.cord", scene);
    cordMat.diffuseColor = new Color3(0.2, 0.19, 0.17);
    const cord = CreateBox("anomaly.ceil.cord", { width: 0.011, height: 1.32, depth: 0.011 }, scene);
    cord.material = cordMat;
    cord.parent = world.root;
    cord.position = new Vector3(0.35, 2.98 - 0.66, 28.08);
    cord.setPivotPoint(new Vector3(0, 0.66, 0)); // swings from the mouth
    const bead = CreateBox("anomaly.ceil.bead", { width: 0.028, height: 0.045, depth: 0.028 }, scene);
    bead.material = cordMat;
    bead.parent = world.root;
    bead.position = new Vector3(0.35, 1.66, 28.08);
    bead.setPivotPoint(new Vector3(0, 1.32, 0));
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const sway = Math.sin(t * 0.9) * 0.055 + Math.sin(t * 0.37) * 0.03;
        cord.rotation.x = sway;
        cord.rotation.z = Math.sin(t * 0.61) * 0.04;
        bead.rotation.x = sway;
        bead.rotation.z = cord.rotation.z;
      },
      cleanup() {
        panel.position.z = 0;
        scene.getMeshByName("anomaly.ceil.cord")?.dispose();
        scene.getMeshByName("anomaly.ceil.bead")?.dispose();
        cordMat.dispose();
      },
    };
  },
};
