/**
 * bin.flipped — the service bin by the south end is knocked over onto
 * its side, a metre from where it stood. Nothing here weighs enough to
 * tip it. Subtle.
 */
import type { AnomalyDef } from "./types";

export const binFlipped: AnomalyDef = {
  id: "bin.flipped",
  displayName: "Tipped Bin",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["bin"],
  excludes: ["bin.wanders"],
  testSeed: "test.bin.flipped",
  dangerous: false,
  activate(ctx) {
    const bin = ctx.world.registry.get("bin") as {
      position: { x: number; y: number; z: number };
      rotation: { z: number; y: number };
    };
    const pos = { x: bin.position.x, y: bin.position.y, z: bin.position.z };
    const rot = { z: bin.rotation.z, y: bin.rotation.y };
    const { rng } = ctx;
    bin.rotation.z = Math.PI / 2 + rng.range(-0.08, 0.08); // on its side
    bin.rotation.y = rng.range(-0.5, 0.5);
    bin.position.y = 0.17; // half-width resting on the rim
    bin.position.x = pos.x - rng.range(0.2, 0.45); // slid toward centre
    bin.position.z = pos.z + rng.range(-0.4, 0.4);
    return {
      update() {},
      cleanup() {
        bin.position.x = pos.x;
        bin.position.y = pos.y;
        bin.position.z = pos.z;
        bin.rotation.z = rot.z;
        bin.rotation.y = rot.y;
      },
    };
  },
};
