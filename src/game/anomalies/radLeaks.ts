/**
 * rad.leaks — the heating convector is leaking: a puddle spreads
 * under the valve end, fed by nothing you can see. Subtle
 * object-class anomaly.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const radLeaks: AnomalyDef = {
  id: "rad.leaks",
  displayName: "Leaking Convector",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["rad.unit"],
  excludes: [],
  testSeed: "test.rad.leaks",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const node = world.registry.get("rad.unit");
    const spawned: { dispose(): void }[] = [];

    // water pooled under the valve end of the radiator
    const puddle = CreatePlane("anomaly.rad.puddle", { width: 0.8, height: 1.0 }, scene);
    puddle.material = world.materials.puddle;
    puddle.parent = node;
    puddle.rotation.x = -Math.PI / 2;
    puddle.position = new Vector3(-0.25, 0.013, 0.95);
    spawned.push(puddle);

    // a dark drip trail running down the fin face to the pool
    const drip = CreatePlane("anomaly.rad.drip", { width: 0.05, height: 0.4 }, scene);
    drip.material = world.materials.grime;
    drip.parent = node;
    drip.rotation.y = Math.PI / 2; // face the corridor (−x)
    drip.position = new Vector3(-0.075, 0.28, 0.94);
    spawned.push(drip);

    return {
      update() {},
      cleanup() {
        for (const s of spawned) s.dispose();
      },
    };
  },
};
