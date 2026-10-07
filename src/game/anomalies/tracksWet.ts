/**
 * tracks.wet — footprints print themselves onto the terrazzo, one step at
 * a time, marching down the corridor with nobody making them. Sound-led:
 * each print lands with a wet squelch (the prints are the visual cue).
 * Unmistakable — the trail advances whether you watch it or not.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const PRINTS = 12;
const STRIDE = 0.74;
const STEP_S = 0.72;

export const tracksWet: AnomalyDef = {
  id: "tracks.wet",
  displayName: "Wet Footprints",
  chapter: 2,
  category: "sound",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["floor"],
  excludes: ["footsteps"],
  testSeed: "test.tracks.wet",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];

    const wet = new StandardMaterial("anomaly.tracks.mat", scene);
    wet.diffuseColor = new Color3(0.04, 0.045, 0.05);
    wet.specularColor = new Color3(0.6, 0.6, 0.6);
    wet.alpha = 0.55;
    wet.disableLighting = false;

    // march lane: seeded x offset, seeded direction (north-bound or
    // south-bound), starting ahead of the player's typical view
    const laneX = rng.range(-0.8, 0.8);
    const dir = rng.int(0, 1) === 0 ? 1 : -1;
    const startZ = rng.range(12, 20);
    const yaw = dir > 0 ? 0 : Math.PI;

    const prints: { mesh: AbstractMesh; at: Vector3 }[] = [];
    for (let i = 0; i < PRINTS; i++) {
      const p = CreatePlane(`anomaly.tracks.print.${i}`, { width: 0.11, height: 0.3 }, scene);
      p.material = wet;
      p.position = new Vector3(
        laneX + (i % 2 === 0 ? -0.13 : 0.13) + rng.range(-0.02, 0.02),
        0.012,
        startZ + dir * i * STRIDE,
      );
      p.rotation.x = Math.PI / 2; // flat on the floor
      p.rotation.z = -yaw; // toe forward along march
      p.parent = world.root;
      p.setEnabled(false);
      created.push(p);
      prints.push({ mesh: p, at: p.position.clone() });
    }

    let elapsed = 0;
    let next = 0;
    return {
      update(dt) {
        elapsed += dt;
        while (next < prints.length && elapsed > next * STEP_S) {
          prints[next]!.mesh.setEnabled(true);
          ctx.audio.playFootstep(prints[next]!.at, 0.8, true);
          next++;
        }
      },
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
        wet.dispose();
      },
    };
  },
};
