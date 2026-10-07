/**
 * vanish.misaligned — the vanishing point won't sit still. The frame
 * rolls a fraction of a degree off level and the corridor's depth
 * breathes in and out on a slow cycle, always inside three per cent —
 * wrong enough to feel in your knees, too small to prove.
 */
import type { AnomalyDef } from "./types";

export const vanishMisaligned: AnomalyDef = {
  id: "vanish.misaligned",
  displayName: "Off-Centre",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["floor"],
  excludes: ["vanish"],
  testSeed: "test.vanish.misaligned",
  dangerous: false,
  activate(ctx) {
    const cam = ctx.player.camera;
    const baseFov = cam.fov;
    const baseRoll = cam.rotation.z;
    let t = ctx.rng.range(0, Math.PI * 2);
    return {
      update(dt) {
        t += dt;
        // 24s depth-breathe + 31s roll wander — incommensurate, never settles
        cam.fov = baseFov * (1 + 0.022 * Math.sin((t * Math.PI * 2) / 24));
        cam.rotation.z = baseRoll + 0.007 * Math.sin((t * Math.PI * 2) / 31);
      },
      cleanup() {
        cam.fov = baseFov;
        cam.rotation.z = baseRoll;
      },
    };
  },
};
