/**
 * fountain.runs — the drinking fountain runs by itself: the bubbler is
 * lifted, a thin water column stands over it, and water pools inside
 * the basin and onto the floor. Nobody touched it. Moderate
 * object-class anomaly.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const fountainRuns: AnomalyDef = {
  id: "fountain.runs",
  displayName: "Running Fountain",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["prop.fountain"],
  excludes: [],
  testSeed: "test.fountain.runs",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const fountain = world.registry.get("prop.fountain");
    const spawned: { dispose(): void }[] = [];
    const cleanups: (() => void)[] = [];

    const bubbler = fountain.getChildMeshes().find((m) => m.name === "prop.fountain.bubbler");
    if (bubbler) {
      const y = bubbler.position.y;
      bubbler.position.y = y + 0.025;
      cleanups.push(() => {
        bubbler.position.y = y;
      });
    }

    const jet = CreateBox("anomaly.fountain.jet", { width: 0.02, height: 0.075, depth: 0.02 }, scene);
    jet.material = world.materials.wallPanel;
    jet.parent = fountain;
    jet.position = new Vector3(-0.02, 0.16, -0.12);
    spawned.push(jet);

    const pool = CreatePlane("anomaly.fountain.pool", { width: 0.18, height: 0.26 }, scene);
    pool.material = world.materials.puddle;
    pool.parent = fountain;
    pool.rotation.x = -Math.PI / 2;
    pool.position = new Vector3(-0.14, 0.1, 0.02);
    spawned.push(pool);

    const floorPool = CreatePlane("anomaly.fountain.floorpool", { width: 0.7, height: 0.85 }, scene);
    floorPool.material = world.materials.puddle;
    floorPool.parent = fountain;
    floorPool.rotation.x = -Math.PI / 2;
    floorPool.position = new Vector3(-0.28, -0.84, 0.1);
    spawned.push(floorPool);

    return {
      update() {},
      cleanup() {
        for (const c of cleanups) c();
        for (const s of spawned) s.dispose();
      },
    };
  },
};
