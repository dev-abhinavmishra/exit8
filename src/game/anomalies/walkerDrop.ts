/**
 * walker.drop — the inspector is empty-handed, and his case file is on
 * the floor. The clipboard he never puts down lies flat in the walk
 * lane ahead of you while he keeps his rounds like nothing is missing.
 * Two facts that cannot both be true.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

export const walkerDrop: AnomalyDef = {
  id: "walker.drop",
  displayName: "Dropped Case File",
  chapter: 2,
  category: "object",
  detectability: "unmistakable",
  weight: 0.75,
  progressionRange: [30, 100],
  requires: ["ambient.walker"],
  excludes: ["walker.absent", "walker.crowd", "walker.crawl", "walker.charge"],
  testSeed: "test.walker.drop",
  dangerous: false,
  activate(ctx) {
    const { scene, rng } = ctx;
    const carried = scene.getMeshByName("ambient.walker.clip") as AbstractMesh | null;
    if (carried) carried.setEnabled(false);
    // the dropped copy — flat on the terrazzo, sheet face-up, seeded in
    // the walk lane so you step over it mid-route
    const drop = CreateBox("anomaly.walker.clip.floor", { width: 0.2, height: 0.02, depth: 0.28 }, scene);
    const src = carried?.material;
    if (src) {
      drop.material = src;
    } else {
      const m = new StandardMaterial("anomaly.walker.clip.mat", scene);
      m.diffuseColor = new Color3(0.16, 0.13, 0.1);
      drop.material = m;
    }
    drop.position = new Vector3(rng.range(-0.3, 0.4), 0.015, rng.range(18, 38));
    drop.rotation.y = rng.range(-0.5, 0.5); // flat on the terrazzo, sheet up
    return {
      update() {},
      cleanup() {
        if (carried) carried.setEnabled(true);
        drop.dispose();
      },
    };
  },
};
