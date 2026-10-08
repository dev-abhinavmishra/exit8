/**
 * rats.scurry — once, as you come up on it, a rat sprints wall to wall
 * ahead of you: low, dark, tail out. No sound, gone in under a second.
 * The corridor is meant to be empty at this hour — nothing alive but
 * you. Subtle: easy to doubt you saw anything at all.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

export const ratsScurry: AnomalyDef = {
  id: "rats.scurry",
  displayName: "Something Crossed",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.6,
  progressionRange: [15, 100],
  requires: ["floor"],
  excludes: ["floor.flood", "tracks.wet"],
  testSeed: "test.rats.scurry",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    // low dark shape: flattened body + angled tail — reads as a rat in
    // the periphery, never long enough to inspect
    const mat = new StandardMaterial("anomaly.rat.mat", scene);
    mat.diffuseColor = new Color3(0.05, 0.04, 0.035);
    mat.specularColor = new Color3(0.02, 0.02, 0.02);
    const node = new TransformNode("anomaly.rat", scene);
    node.parent = world.root;
    const body = CreateBox("anomaly.rat.body", { width: 0.1, height: 0.07, depth: 0.3 }, scene);
    body.material = mat;
    body.position.set(0, 0.035, 0.1);
    body.parent = node;
    const tail = CreateBox("anomaly.rat.tail", { width: 0.02, height: 0.015, depth: 0.26 }, scene);
    tail.material = mat;
    tail.position.set(0, 0.02, -0.18);
    tail.rotation.y = 0.18;
    tail.parent = node;
    node.setEnabled(false);

    const crossZ = rng.range(20, 40);
    const eastward = rng.draw() < 0.5;
    const fromX = eastward ? -1.75 : 1.75;
    const toX = -fromX;
    node.position.set(fromX, 0, crossZ);
    node.rotation.y = eastward ? Math.PI / 2 : -Math.PI / 2; // nose along travel

    let t = -1; // -1: waiting on the player's approach
    const DUR = 0.85;
    return {
      update(dt) {
        if (t < 0) {
          // fires when the player is within sight of the crossing line —
          // close enough to catch it, far enough to doubt it
          if (Math.abs(ctx.player.position.z - crossZ) < 9) {
            t = 0;
            node.setEnabled(true);
          }
          return;
        }
        t += dt;
        const k = Math.min(1, t / DUR);
        // rats don't run a clean line — a little sag in the sprint
        const x = fromX + (toX - fromX) * k;
        node.position.set(x, 0, crossZ - Math.sin(k * Math.PI) * 0.5);
        node.position.y = Math.abs(Math.sin(t * 40)) * 0.012; // scurry bob
        if (k >= 1) {
          node.setEnabled(false);
          t = Number.MAX_SAFE_INTEGER; // once per loop
        }
      },
      cleanup() {
        node.dispose(false, true);
        mat.dispose();
      },
    };
  },
};
