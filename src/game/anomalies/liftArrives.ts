/**
 * lift.arrives — the out-of-service lift answers anyway. The call lamp
 * wakes, the leaves slide open a hand's width onto a dark shaft, and
 * somewhere below, a chime. Moderate: unmistakable in the junction,
 * invisible until you turn around otherwise.
 */
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DOOR_Z = 49.5;

export const liftArrives: AnomalyDef = {
  id: "lift.arrives",
  displayName: "The Lift Answered",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["lift.door.-1", "lift.door.1", "lift.panel.lamp"],
  excludes: [],
  testSeed: "test.lift.arrives",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const world = ctx.world;
    const lamp = world.registry.mesh("lift.panel.lamp");
    const leaves = [world.registry.mesh("lift.door.-1"), world.registry.mesh("lift.door.1")];
    const home = leaves.map((l) => l.position.z);
    const open = ctx.rng.range(0.32, 0.55); // seeded gap width

    lamp.material = world.materials.trofferLit;
    leaves.forEach((l, i) => {
      l.position.z = home[i]! + (i === 0 ? -open : open);
    });

    // a shaft light that isn't on any switch — spills warm into the junction
    const glow = new PointLight("anomaly.lift.glow", new Vector3(1.5, 2.0, DOOR_Z), ctx.scene);
    glow.intensity = 1.6;
    glow.diffuse = new Color3(1.0, 0.72, 0.42);
    glow.range = 7;

    ctx.audio.playChime(new Vector3(1.6, 1.7, DOOR_Z));

    return {
      update() {},
      cleanup() {
        lamp.material = world.materials.trofferDim;
        leaves.forEach((l, i) => {
          l.position.z = home[i]!;
        });
        glow.dispose();
      },
    };
  },
};
