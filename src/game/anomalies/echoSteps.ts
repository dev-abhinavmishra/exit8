/**
 * echo.steps — your footsteps get an answer. While you walk, a second
 * tread lands half a beat after yours, a few metres behind you in the
 * direction you came from. It's not reverb — the corridor's real echo
 * already lives on your steps; this is a separate walker matching
 * your pace. Sound-only; the anomaly bus captions it as not yours.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const echoSteps: AnomalyDef = {
  id: "echo.steps",
  displayName: "Steps Behind Yours",
  chapter: 3,
  category: "sound",
  detectability: "moderate",
  weight: 0.65,
  progressionRange: [35, 100],
  requires: ["light.zone.gallery"],
  excludes: ["footsteps.extra", "machine.silence"],
  testSeed: "test.echo.steps",
  dangerous: false,
  activate(ctx) {
    const prev = ctx.player.position.clone();
    const dir = new Vector3(0, 0, 1);
    let acc = 0;
    let interval = ctx.rng.range(0.5, 0.6);
    return {
      update(dt) {
        const p = ctx.player.position;
        const dx = p.x - prev.x;
        const dz = p.z - prev.z;
        const speed = Math.hypot(dx, dz) / Math.max(dt, 1e-4);
        if (speed > 0.4) {
          // smooth the walk direction so the tread lands behind you
          dir.x += (dx / Math.hypot(dx, dz) - dir.x) * 0.2;
          dir.z += (dz / Math.hypot(dx, dz) - dir.z) * 0.2;
          acc += dt;
          if (acc >= interval) {
            acc = 0;
            interval = ctx.rng.range(0.48, 0.62);
            const back = new Vector3(
              p.x - dir.x * ctx.rng.range(2.5, 4) + ctx.rng.range(-0.4, 0.4),
              p.y,
              p.z - dir.z * ctx.rng.range(2.5, 4) + ctx.rng.range(-0.4, 0.4),
            );
            ctx.audio.playFootstep(back, 0.45, true);
          }
        } else {
          acc = 0;
        }
        prev.copyFrom(p);
      },
      cleanup() {},
    };
  },
};
