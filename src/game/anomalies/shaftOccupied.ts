/**
 * shaft.occupied — the sealed lift's leaves stand parted onto the dead
 * shaft, and someone is standing in it. A silhouette squared to the
 * doors, backlit against the shaft's dark plate — visible only through
 * the gap, only once you're inside the junction. Moderate: unmistakable
 * at the mouth, easy to miss from mid-corridor.
 */
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DOOR_Z = 49.5;

export const shaftOccupied: AnomalyDef = {
  id: "shaft.occupied",
  displayName: "Someone In The Shaft",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.65,
  progressionRange: [30, 100],
  requires: ["lift.door.-1", "lift.door.1", "lift.panel.lamp"],
  excludes: ["lift.arrives", "lift.car", "figure", "shadow.figure", "lights.blackout", "watcher.follows", "bay.occupied"],
  testSeed: "test.shaft.occupied",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const lamp = world.registry.mesh("lift.panel.lamp");
    const leaves = [world.registry.mesh("lift.door.-1"), world.registry.mesh("lift.door.1")];
    const home = leaves.map((l) => l.position.z);
    const open = rng.range(0.32, 0.4);

    lamp.material = world.materials.trofferLit;
    leaves.forEach((l, i) => {
      l.position.z = home[i]! + (i === 0 ? -open : open);
    });

    // the occupant — squared to the doors, inside the throat
    const fig = buildFigure(scene, world.root, "anomaly.shaft.occupied", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    fig.root.position.set(2.56, 0.02, DOOR_Z);
    fig.root.rotation.y = -Math.PI / 2; // faces -x, out through the gap

    // a dim cold spill inside the shaft — edges the silhouette against
    // the black plate without reading as "the lift is lit"
    const glow = new PointLight("anomaly.shaft.glow", new Vector3(2.62, 2.15, DOOR_Z), scene);
    glow.intensity = 1.1;
    glow.diffuse = new Color3(0.7, 0.8, 0.95);
    glow.range = 2.2;

    return {
      update() {},
      cleanup() {
        lamp.material = world.materials.trofferDim;
        leaves.forEach((l, i) => {
          l.position.z = home[i]!;
        });
        fig.root.dispose(false, true);
        glow.dispose();
      },
    };
  },
};
