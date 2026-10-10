import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyContext } from "./types";

// #259 pipe.leaks — the red standpipe's mid-corridor flange weeps: a
// thin cold column down from the joint, a fresh puddle on the terrazzo,
// occasional plinks. The maintenance corridor should be dry.
export const pipeLeaks: AnomalyDef = {
  id: "pipe.leaks",
  displayName: "The Standpipe Weeps",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["pipe.flange.m27"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "ceiling.weeps", "floor.flood"],
  testSeed: "test.pipe.leaks",
  dangerous: false,
  activate(ctx: AnomalyContext) {
    const { scene, rng } = ctx;
    const world = ctx.world;
    const flange = world.registry.mesh("pipe.flange.m27");
    const p = flange.getAbsolutePosition();
    const waterMat = new StandardMaterial("mat.anomaly.pipeleak", scene);
    waterMat.diffuseColor = new Color3(0.6, 0.72, 0.76);
    waterMat.emissiveColor = new Color3(0.2, 0.28, 0.3);
    waterMat.alpha = 0.5;
    const stream = CreateCylinder(
      "anomaly.pipe.stream",
      { height: 2.4, diameter: 0.018, tessellation: 8 },
      scene,
    );
    stream.material = waterMat;
    stream.position.set(p.x + 0.02, p.y - 1.25, p.z);
    const pool = CreatePlane("anomaly.pipe.pool", { width: 0.6, height: 0.5 }, scene);
    pool.material = world.materials.puddle;
    pool.position.set(p.x + 0.02, 0.006, p.z);
    pool.rotation.x = Math.PI / 2;
    let dripT = 0;
    let next = 0.8 + rng.draw() * 1.6;
    return {
      update(dt: number) {
        dripT += dt;
        if (dripT >= next) {
          dripT = 0;
          next = 0.8 + rng.draw() * 2.4;
          ctx.audio.playDrip(new Vector3(p.x, 0.3, p.z));
        }
      },
      cleanup() {
        stream.dispose();
        pool.dispose();
        waterMat.dispose();
      },
    };
  },
};
