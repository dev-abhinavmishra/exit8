/**
 * bench.sit — someone is sitting on the waiting bench. Dark coat,
 * hands folded, facing the records wall. It does not look up as you
 * pass, and it is gone on the next loop either way.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
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
    // seated: hips on the slat, torso up, thighs out, shins down
    add("anomaly.sit.torso", 0.32, 0.62, 0.2, bx, 0.78, bz);
    add("anomaly.sit.head", 0.16, 0.2, 0.18, bx, 1.2, bz);
    add("anomaly.sit.thighs", 0.5, 0.14, 0.2, bx + 0.28, 0.5, bz);
    add("anomaly.sit.shins", 0.12, 0.45, 0.18, bx + 0.48, 0.22, bz);
    return {
      update() {},
      cleanup() {
        for (const p of parts) p.dispose();
        parts.length = 0;
      },
    };
  },
};
