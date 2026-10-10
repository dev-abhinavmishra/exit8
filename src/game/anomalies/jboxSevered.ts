import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * jbox.severed — the west junction box z44.8 is torn open, its lid on
 * the floor, and a live cable end spits light into the dark of the
 * box. Moderate.
 */
export const jboxSevered: AnomalyDef = {
  id: "jbox.severed",
  displayName: "The Junction Box Is Torn",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["svc.jbox.1.lid"],
  excludes: [],
  testSeed: "test.jbox.severed",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const lid = world.registry.mesh("svc.jbox.1.lid");
    lid.setEnabled(false);
    const floor = CreateBox("anomaly.jbox.lid", { width: 0.02, height: 0.3, depth: 0.22 }, scene);
    floor.material = world.materials.wallPanel;
    floor.parent = world.root;
    floor.position.set(-1.5, 0.16, 44.95);
    floor.rotation.z = 1.35;
    floor.rotation.y = 0.4;
    const cable = CreateBox("anomaly.jbox.cable", { width: 0.028, height: 0.5, depth: 0.028 }, scene);
    cable.material = world.materials.rubber;
    cable.parent = world.root;
    cable.position.set(-1.66, 1.78, 44.8);
    cable.rotation.z = -0.55;
    const spark = new StandardMaterial("mat.jbox.spark", scene);
    spark.emissiveColor = new Color3(0.85, 0.7, 0.3);
    spark.diffuseColor = Color3.Black();
    const tip = CreateBox("anomaly.jbox.tip", { width: 0.05, height: 0.05, depth: 0.05 }, scene);
    tip.material = spark;
    tip.parent = world.root;
    tip.position.set(-1.52, 1.58, 44.8);
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        const hot = Math.sin(t * 23) > 0.55 || Math.sin(t * 47) > 0.9;
        spark.emissiveColor = hot ? new Color3(0.9, 0.75, 0.35) : new Color3(0.02, 0.015, 0.01);
      },
      cleanup() {
        lid.setEnabled(true);
        floor.dispose();
        cable.dispose();
        tip.dispose();
        spark.dispose();
      },
    };
  },
};
