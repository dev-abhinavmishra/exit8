import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * alarm.gone — the pull station is unbolted off the wall: a pale
 * scar rectangle and two screw stubs where the red box hung.
 */
export const alarmGone: AnomalyDef = {
  id: "alarm.gone",
  displayName: "No Alarm Tonight",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["alarm"],
  excludes: ["alarm.pulled", "alarm.open", "alarm.knob.gone"],
  testSeed: "test.alarm.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const alarm = world.registry.get("alarm");
    alarm.setEnabled(false);
    const scarMat = new StandardMaterial("mat.alarm.scar", scene);
    scarMat.diffuseColor = new Color3(0.13, 0.12, 0.1);
    const scar = CreateBox("anomaly.alarm.scar", { width: 0.01, height: 0.17, depth: 0.09 }, scene);
    scar.material = scarMat;
    scar.parent = world.root;
    scar.position = new Vector3(1.795, 1.5, 47.0);
    const stubMat = new StandardMaterial("mat.alarm.stub", scene);
    stubMat.diffuseColor = new Color3(0.4, 0.38, 0.35);
    const parts: string[] = [scar.name];
    for (const sy of [1.55, 1.45]) {
      const stub = CreateBox(
        `anomaly.alarm.stub.${sy}`,
        { width: 0.015, height: 0.012, depth: 0.012 },
        scene,
      );
      stub.material = stubMat;
      stub.parent = world.root;
      stub.position = new Vector3(1.8, sy, 47.0);
      parts.push(stub.name);
    }
    return {
      update() {},
      cleanup() {
        alarm.setEnabled(true);
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        scarMat.dispose();
        stubMat.dispose();
      },
    };
  },
};
