/**
 * figure.south — somebody is waiting in the south airlock. The inner
 * doors part at the commit approach and a dark figure is standing dead
 * centre beyond the threshold, exactly where the route says nobody is.
 * It never moves — the judgment resolves before you reach it.
 * Unmistakable.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

const FIG_Z = 58.7;

export const figureSouth: AnomalyDef = {
  id: "figure.south",
  displayName: "Figure Past the Doors",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [35, 100],
  requires: ["al.south.cap"],
  excludes: ["watcher.follows", "figure"],
  testSeed: "test.figure.south",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const node = new TransformNode("anomaly.figure.south", scene);
    node.parent = world.root;
    node.position = new Vector3(0, 0, FIG_Z);
    node.rotation.y = Math.PI; // squared up at the corridor

    const made: AbstractMesh[] = [];
    const part = (name: string, w: number, h: number, d: number, y: number): AbstractMesh => {
      const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
      m.material = world.materials.rubber;
      m.position.y = y;
      m.parent = node;
      made.push(m);
      return m;
    };
    part("anomaly.figure.south.body", 0.46, 1.32, 0.28, 0.66);
    part("anomaly.figure.south.shoulders", 0.6, 0.22, 0.3, 1.36);
    const head = part("anomaly.figure.south.head", 0.22, 0.27, 0.24, 1.62);
    head.rotation.z = 0.14; // the small wrongness: a tilted head

    return {
      update() {},
      cleanup() {
        for (const m of made) m.dispose();
        node.dispose();
      },
    };
  },
};
