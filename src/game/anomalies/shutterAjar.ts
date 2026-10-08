/**
 * shutter.ajar — the clinic shutter is lifted a hand's width off the
 * counter. Below it: not the counter top, a dark gap — the inside is
 * not lit, and nothing in it answers the light.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const LIFT = 0.18;

export const shutterAjar: AnomalyDef = {
  id: "shutter.ajar",
  displayName: "Open Shutter",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["clinic.shutter", "clinic.counter"],
  excludes: ["counter.worker"],
  testSeed: "test.shutter.ajar",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const shutter = world.registry.get("clinic.shutter") as {
      position: { y: number; x: number; z: number };
    };
    const homeY = shutter.position.y;
    shutter.position.y = homeY + LIFT;

    // dark void where the gap now shows — nothing reflects back
    const void_ = CreateBox("anomaly.shutter.void", { width: 0.02, height: LIFT + 0.02, depth: 4.2 }, scene);
    void_.material = world.materials.rubber;
    void_.position = new Vector3(
      shutter.position.x + 0.01,
      homeY - 1.3 / 2 + LIFT / 2 - 0.05,
      shutter.position.z,
    );
    void_.parent = world.root;

    return {
      update() {},
      cleanup() {
        shutter.position.y = homeY;
        void_.dispose();
      },
    };
  },
};
