/**
 * bucket.tipped — the janitorial bucket is on its side, the mop fallen
 * flat across the floor, water pooled. Nobody heard it go over.
 * Moderate object-class anomaly.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const bucketTipped: AnomalyDef = {
  id: "bucket.tipped",
  displayName: "Tipped Bucket",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["mop.bucket"],
  excludes: [],
  testSeed: "test.bucket.tipped",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const node = world.registry.get("mop.bucket");
    const spawned: { dispose(): void }[] = [];
    const cleanups: (() => void)[] = [];

    const body = node.getChildMeshes().find((m) => m.name === "mop.bucket.body");
    if (body) {
      const pos = body.position.clone();
      const rot = body.rotation.clone();
      body.rotation.z = Math.PI / 2;
      body.position.set(0.16, 0.1, 0.05);
      cleanups.push(() => {
        body.rotation.copyFrom(rot);
        body.position.copyFrom(pos);
      });
    }
    const wringer = node.getChildMeshes().find((m) => m.name === "mop.bucket.wringer");
    if (wringer) {
      const pos = wringer.position.clone();
      wringer.position.set(0.32, 0.07, 0.14);
      wringer.rotation.z = 1.2;
      cleanups.push(() => {
        wringer.position.copyFrom(pos);
        wringer.rotation.z = 0;
      });
    }
    const mop = node.getChildMeshes().find((m) => m.name === "mop.bucket.mop");
    if (mop) {
      const pos = mop.position.clone();
      const rot = mop.rotation.clone();
      mop.rotation.set(-1.45, 0, 0.12);
      mop.position.set(0.05, 0.03, -0.55);
      cleanups.push(() => {
        mop.rotation.copyFrom(rot);
        mop.position.copyFrom(pos);
      });
    }
    const mopHead = node.getChildMeshes().find((m) => m.name === "mop.bucket.mophead");
    if (mopHead) {
      const pos = mopHead.position.clone();
      mopHead.position.set(0.05, 0.04, -1.15);
      cleanups.push(() => {
        mopHead.position.copyFrom(pos);
      });
    }

    const puddle = CreateBox("anomaly.bucket.puddle", { width: 0.9, height: 0.006, depth: 1.1 }, scene);
    puddle.material = world.materials.puddle;
    puddle.parent = node;
    puddle.position = new Vector3(0.3, 0.013, 0.3);
    spawned.push(puddle);

    return {
      update() {},
      cleanup() {
        for (const c of cleanups) c();
        for (const s of spawned) s.dispose();
      },
    };
  },
};
