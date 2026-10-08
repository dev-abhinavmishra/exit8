/**
 * arrow.extra — a fourth routing mark is ground into the terrazzo,
 * painted where the floor never carried paint before. Same worn "7→",
 * same speckle — just one more than the run owns. Subtle
 * memorization-trap anomaly.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

// the three baseline marks sit at z 10 / 30 / 48 — the extra lands
// somewhere the route memory says is bare
const SPOTS: [number, number][] = [
  [0.1, 17.5],
  [-0.3, 39.2],
  [0.4, 51.5],
];

export const arrowExtra: AnomalyDef = {
  id: "arrow.extra",
  displayName: "A Fourth Route Mark",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["floor.arrow.10", "floor.arrow.30", "floor.arrow.48"],
  excludes: ["arrow.points", "arrows.gone", "guide.red"],
  testSeed: "test.arrow.extra",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { rng } = ctx;
    const src = ctx.world.registry.mesh(`floor.arrow.${rng.pick([10, 30, 48])}`);
    if (!src) return { update() {}, cleanup() {} };
    const clone = src.clone(`anomaly.arrow.extra`, null);
    if (!clone) return { update() {}, cleanup() {} };
    const [x, z] = rng.pick(SPOTS);
    clone.position = new Vector3(x, 0.012, z);
    clone.rotation.y = rng.range(-0.12, 0.12);
    return {
      update() {},
      cleanup() {
        clone.dispose();
      },
    };
  },
};
