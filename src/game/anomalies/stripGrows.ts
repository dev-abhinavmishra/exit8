/**
 * strip.grows — the tactile guide strip no longer stops at the north
 * airlock. It continues through the inner door, across the airlock
 * floor, and ends at the cap — the line now leads somewhere it never
 * led. Subtle until you look back.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

export const stripGrows: AnomalyDef = {
  id: "strip.grows",
  displayName: "Extended Guide",
  chapter: 1,
  category: "spatial",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["guide.seg.0"],
  excludes: ["guide", "airlock.breach", "watcher.follows"],
  testSeed: "test.strip.grows",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];
    const x = 0.72 + rng.range(-0.06, 0.06);
    // three added segments marching into the airlock (z -4.2..0)
    for (let i = 0; i < 3; i++) {
      const z0 = -4.2 + i * 1.55;
      const seg = CreateBox(`anomaly.strip.${i}`, { width: 0.34, height: 0.014, depth: 1.5 }, scene);
      seg.material = world.materials.guideStrip;
      seg.position = new Vector3(x, 0.008, z0 + 0.75);
      seg.parent = world.root;
      created.push(seg);
    }
    return {
      update() {},
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
