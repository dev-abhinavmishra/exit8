/**
 * walker.crowd — there are two of him now. A second inspector walks the
 * same route in the left lane, starting from the far end, so your first
 * look down the corridor catches him coming the other way. Same coat,
 * same stripe, same cadence. The shift brief listed one inspector.
 */
import "@babylonjs/core/Meshes/instancedMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

const WALK_Z0 = 7;
const WALK_Z1 = 48;
const SPEED = 1.05;
const PAUSE_S = 5;
const X = -0.55;

export const walkerCrowd: AnomalyDef = {
  id: "walker.crowd",
  displayName: "Second Inspector",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [40, 100],
  requires: ["ambient.walker"],
  excludes: ["walker", "watcher.follows", "figure"],
  testSeed: "test.walker.crowd",
  dangerous: false,
  activate(ctx) {
    const { world } = ctx;
    const src = world.registry.get("ambient.walker") as TransformNode;
    const twin = src.instantiateHierarchy(world.root);
    if (!twin) throw new Error("walker.crowd: clone failed");

    const pivots: TransformNode[] = [];
    for (const d of twin.getChildTransformNodes(false)) {
      if (d.name.includes(".hip.") || d.name.includes(".arm.")) pivots.push(d);
    }

    let z = WALK_Z1; // starts at the far end, walking north toward you
    let dir = -1;
    let pauseT = 0;
    let bobT = 0;
    twin.position.set(X, 0, z);
    twin.rotation.y = dir > 0 ? 0 : Math.PI;

    return {
      update(dt) {
        if (pauseT > 0) {
          pauseT -= dt;
          for (const p of pivots) p.rotation.x = 0;
          return;
        }
        bobT += dt;
        const swing = Math.sin(bobT * 3.4);
        for (const p of pivots) {
          p.rotation.x = p.name.includes(".hip.")
            ? swing * 0.5 * (p.name.endsWith("-1") ? 1 : -1)
            : swing * 0.32 * (p.name.endsWith("-1") ? -1 : 1);
        }
        z += dir * SPEED * dt;
        if (z <= WALK_Z0) {
          z = WALK_Z0;
          dir = 1;
          pauseT = PAUSE_S;
        } else if (z >= WALK_Z1) {
          z = WALK_Z1;
          dir = -1;
          pauseT = PAUSE_S;
        }
        twin.position.z = z;
        twin.rotation.y = dir > 0 ? 0 : Math.PI;
      },
      cleanup() {
        twin.dispose();
      },
    };
  },
};
