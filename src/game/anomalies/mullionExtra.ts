/**
 * mullion.extra — the glass run has one more upright than it should.
 * A sixth steel mullion stands mid-bay where there were always five.
 * Subtle: nobody counts mullions — that's the point.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const mullionExtra: AnomalyDef = {
  id: "mullion.extra",
  displayName: "Sixth Mullion",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["gallery"],
  testSeed: "test.mullion.extra",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    // existing mullions at z 20/23/26/29/32 — insert mid-bay
    const mz = [21.5, 24.5, 27.5, 30.5][rng.int(0, 3)]!;
    const m = CreateBox("anomaly.mullion", { width: 0.09, height: 2.0, depth: 0.18 }, scene);
    m.material = world.materials.steel;
    m.position = new Vector3(1.8, 1.5, mz);
    m.parent = world.root;
    return {
      update() {},
      cleanup() {
        m.dispose();
      },
    };
  },
};
