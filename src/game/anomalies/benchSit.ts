/**
 * bench.sit — someone is sitting on the waiting bench. Dark coat,
 * hands folded, facing the records wall. It does not look up as you
 * pass, and it is gone on the next loop either way.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

export const benchSit: AnomalyDef = {
  id: "bench.sit",
  displayName: "Someone Waiting",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [40, 100],
  requires: ["bench.south"],
  excludes: ["bench.moved", "figure", "watcher.follows"],
  testSeed: "test.bench.sit",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const bench = world.registry.mesh("bench.south");
    const bx = bench.position.x;
    const bz = bench.position.z + rng.range(-0.4, 0.4);
    const parts: AbstractMesh[] = [];
    const add = (name: string, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
      m.material = world.materials.rubber;
      m.position = new Vector3(x, y, z);
      m.parent = world.root;
      parts.push(m);
      return m;
    };
    // seated: hips on the slat, torso up, thighs out, shins down —
    // sphere skull + shoulders + hands on knees so it reads as a body
    add("anomaly.sit.torso", 0.32, 0.62, 0.2, bx, 0.78, bz);
    add("anomaly.sit.shoulders", 0.42, 0.11, 0.22, bx, 1.06, bz);
    add("anomaly.sit.thighs", 0.5, 0.14, 0.2, bx + 0.28, 0.5, bz);
    add("anomaly.sit.shins", 0.12, 0.45, 0.18, bx + 0.48, 0.22, bz);
    add("anomaly.sit.shoes", 0.14, 0.09, 0.24, bx + 0.48, 0.045, bz + 0.04);
    // forearms resting forward onto the thighs
    for (const sz of [-1, 1]) {
      add(`anomaly.sit.arm.${sz}`, 0.09, 0.34, 0.1, bx + 0.05, 0.78, bz + sz * 0.17);
      add(`anomaly.sit.hand.${sz}`, 0.16, 0.07, 0.09, bx + 0.32, 0.55, bz + sz * 0.16);
    }
    const skull = CreateSphere("anomaly.sit.head", { diameter: 0.19, segments: 10 }, scene);
    skull.material = world.materials.rubber;
    skull.scaling = new Vector3(1, 1.35, 0.95);
    skull.position = new Vector3(bx, 1.24, bz);
    skull.parent = world.root;
    parts.push(skull);
    return {
      update() {},
      cleanup() {
        for (const p of parts) p.dispose();
        parts.length = 0;
      },
    };
  },
};
