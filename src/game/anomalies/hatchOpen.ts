/**
 * hatch.open — a service hatch stands open in the east wall panels.
 * The reveal behind it is flat, unlit dark — a maintenance void that
 * was never drawn on the survey. The hatch door itself hangs ajar
 * beside the gap.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

const WALL_X = 1.74; // east wall inner face

export const hatchOpen: AnomalyDef = {
  id: "hatch.open",
  displayName: "Open Hatch",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["wall.right.2"],
  excludes: ["gallery", "door.ajar", "depth.mismatch"],
  testSeed: "test.hatch.open",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];
    const z = rng.range(34, 50);
    const y = rng.range(1.15, 1.5);

    // the black maintenance void
    const void_ = CreateBox("anomaly.hatch.void", { width: 0.05, height: 0.9, depth: 0.6 }, scene);
    void_.material = world.materials.rubber;
    void_.position = new Vector3(WALL_X - 0.015, y, z);
    void_.parent = world.root;
    created.push(void_);

    // steel rim — 4 thin strips framing the void so it reads as a hatch
    for (const [dy, dz, h, d] of [
      [0.47, 0, 0.04, 0.64],
      [-0.47, 0, 0.04, 0.64],
      [0, 0.32, 0.98, 0.04],
      [0, -0.32, 0.98, 0.04],
    ] as const) {
      const rim = CreateBox(
        `anomaly.hatch.rim.${created.length}`,
        { width: 0.02, height: h, depth: d },
        scene,
      );
      rim.material = world.materials.steel;
      rim.position = new Vector3(WALL_X - 0.008, y + dy, z + dz);
      rim.parent = world.root;
      created.push(rim);
    }

    // the door itself, hinged open into the corridor
    const door = CreateBox("anomaly.hatch.door", { width: 0.03, height: 0.88, depth: 0.58 }, scene);
    door.material = world.materials.steel;
    door.position = new Vector3(WALL_X - 0.3, y, z - 0.35);
    door.rotation.y = 0.9 + rng.range(-0.15, 0.15); // ajar toward the player
    door.parent = world.root;
    created.push(door);

    return {
      update() {},
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
