/**
 * corridor.breathes — the corridor inhales. The plain wall segments
 * press a few centimetres inward and ease back on a slow cycle, the
 * squeeze travelling south down the run like a swallow. The corridor
 * is measurably narrower while it's breathing — you can walk inside
 * the inhale. Unmistakable systemic anomaly.
 */
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

// breathing applies to the plain wall runs; the records facade and the
// gallery wall stay put (their fixtures would shear off otherwise)
// wall.left.4 is the run south of the S-2 bay mouth — it breathes too
const SEGMENTS = [
  "wall.left.0",
  "wall.left.2",
  "wall.left.3",
  "wall.left.4",
  "wall.right.0",
  "wall.right.0b",
  "wall.right.2",
];

export const corridorBreathes: AnomalyDef = {
  id: "corridor.breathes",
  displayName: "The Corridor Inhales",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [45, 100],
  requires: [
    "wall.left.0",
    "wall.left.2",
    "wall.left.3",
    "wall.left.4",
    "wall.right.0",
    "wall.right.0b",
    "wall.right.2",
  ],
  excludes: ["hall.stretch", "depth.mismatch", "sightline.impossible", "pace.dissolves", "zone.pulse"],
  testSeed: "test.corridor.breathes",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { rng } = ctx;
    const amp = rng.range(0.035, 0.05);
    const period = rng.range(6.5, 9);
    const walls: { mesh: { position: Vector3 }; base: number; side: number; phase: number }[] = [];
    for (const name of SEGMENTS) {
      const mesh = ctx.world.registry.mesh(name);
      if (!mesh) continue;
      const side = mesh.position.x > 0 ? 1 : -1;
      // phase offset follows the wall's span down-corridor — the squeeze travels
      walls.push({ mesh, base: mesh.position.x, side, phase: mesh.position.z * 0.14 });
    }
    if (!walls.length) return { update() {}, cleanup() {} };
    let t = 0;
    return {
      update(dt) {
        t += dt;
        for (const w of walls) {
          const s = 0.5 - 0.5 * Math.cos(((t + w.phase) * Math.PI * 2) / period); // 0→1→0
          w.mesh.position.x = w.base - w.side * amp * s;
        }
      },
      cleanup() {
        for (const w of walls) w.mesh.position.x = w.base;
      },
    };
  },
};
