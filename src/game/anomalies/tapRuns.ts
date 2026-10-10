/**
 * tap.runs — one washroom tap is running: a thin stream falls into the
 * basin well, water sheets over the porcelain lip onto the slab, and a
 * plink lands every couple of seconds. The room was empty a second ago.
 * Subtle-moderate: the sound reaches you at the doorway.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const tapRuns: AnomalyDef = {
  id: "tap.runs",
  displayName: "The Tap Is Running",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["wash.tap.0"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.tap.runs",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const tap = world.registry.get("wash.tap.0");
    const p = tap.getAbsolutePosition(); // tap root sits at slab height
    // water: a thin pale column nozzle → basin, plus a sheen where it
    // has been running long enough to overtop the well
    const waterMat = new StandardMaterial("anomaly.tap.water", scene);
    waterMat.diffuseColor = new Color3(0.6, 0.72, 0.76);
    waterMat.emissiveColor = new Color3(0.22, 0.3, 0.32);
    waterMat.alpha = 0.55;
    waterMat.specularColor = new Color3(0.5, 0.6, 0.62);
    const stream = CreateCylinder("anomaly.tap.stream", { height: 0.12, diameter: 0.024, tessellation: 8 }, scene);
    stream.material = waterMat;
    stream.position.set(p.x - 0.15, 0.95, p.z);
    const spill = CreatePlane("anomaly.tap.spill", { width: 0.34, height: 0.3 }, scene);
    spill.material = world.materials.puddle;
    spill.rotation.x = Math.PI / 2;
    spill.position.set(p.x - 0.18, 0.912, p.z + 0.1);
    const drip = new Vector3(p.x - 0.16, 0.9, p.z);
    let t = 0.6;
    let plinkAt = 1.4 + rng.draw() * 1.6;
    return {
      update(dt) {
        t += dt;
        if (t >= plinkAt) {
          t = 0;
          plinkAt = 1.4 + rng.draw() * 1.8;
          ctx.audio.playDrip(drip);
        }
      },
      cleanup() {
        stream.dispose();
        spill.dispose();
        waterMat.dispose();
      },
    };
  },
};
