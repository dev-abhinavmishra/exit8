/**
 * bench.flipped — the west-wall bench is upended: seat down, legs
 * kicked into the air. It did not move far — it was handled.
 * Moderate.
 */
import type { AnomalyDef } from "./types";

export const benchFlipped: AnomalyDef = {
  id: "bench.flipped",
  displayName: "Bench Overturned",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["bench.south"],
  excludes: ["bench.moved", "bench.gone", "bench.sit"],
  testSeed: "test.bench.flipped",
  dangerous: false,
  activate(ctx) {
    const bench = ctx.world.registry.get("bench.south");
    const origPos = bench.position.clone();
    const origRot = bench.rotation.clone();
    // seat face to the floor, legs straight up — reads instantly
    // at corridor distance; a slight yaw drift keeps it placed
    bench.rotation.z = Math.PI;
    bench.rotation.y = origRot.y + ctx.rng.range(-0.3, 0.3);
    bench.position.y = origPos.y + 0.47;
    return {
      update() {},
      cleanup() {
        bench.rotation.z = origRot.z;
        bench.rotation.y = origRot.y;
        bench.position.copyFrom(origPos);
      },
    };
  },
};
