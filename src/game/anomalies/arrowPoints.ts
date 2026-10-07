/**
 * arrow.points — one worn route decal on the terrazzo has been
 * re-painted to point the wrong way. The "7→" that every loop said
 * walks south now walks north. A memorization trap: it is only
 * wrong if you remember it was right.
 */
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const arrowPoints: AnomalyDef = {
  id: "arrow.points",
  displayName: "Arrow Points North",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [0, 100],
  requires: ["floor.arrow.10", "floor.arrow.30", "floor.arrow.48"],
  excludes: ["floor"],
  testSeed: "test.arrow.points",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world, rng } = ctx;
    const z = rng.pick([10, 30, 48]);
    const decal = world.registry.mesh(`floor.arrow.${z}`);
    // 180° about world-up keeps the face up but turns the paint around
    decal.rotate(Axis.Y, Math.PI, Space.WORLD);
    return {
      update() {},
      cleanup() {
        decal.rotate(Axis.Y, -Math.PI, Space.WORLD);
      },
    };
  },
};
