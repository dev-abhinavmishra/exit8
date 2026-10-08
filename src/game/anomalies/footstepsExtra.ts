/**
 * footsteps.extra — a second footstep cadence trails the player's own steps
 * by ~0.4 s, positioned a couple of meters behind them. It stops when the
 * player stops. Sound-led anomaly with a visual accessibility cue: a
 * condensation patch breathes onto the gallery glass in time.
 */
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const footstepsExtra: AnomalyDef = {
  id: "footsteps.extra",
  displayName: "Trailing Footsteps",
  chapter: 1,
  category: "sound",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["wall.gallery.glass", "anomaly.condensation"],
  excludes: ["sound.cadence"],
  testSeed: "test.footsteps.extra",
  dangerous: false,
  activate(ctx) {
    const lag = ctx.rng.range(0.32, 0.5);
    const delaySamples: { t: number; pos: Vector3; intensity: number }[] = [];
    let clock = 0;
    let cueT = 0;
    const patch = ctx.world.condensationPatch;
    if (ctx.visualCues) {
      patch.isVisible = true;
      patch.setEnabled(true);
    }
    const unsub = ctx.player.onFootstep((pos, intensity) => {
      delaySamples.push({ t: clock + lag, pos: pos.clone(), intensity });
    });
    return {
      update(dt) {
        clock += dt;
        while (delaySamples.length > 0 && delaySamples[0] && delaySamples[0].t <= clock) {
          const s = delaySamples.shift();
          if (!s) break;
          // the "other" walker is slightly off-axis behind the player
          const behind = s.pos.add(ctx.player.forward().scale(-2.4));
          behind.x += ctx.rng.range(-0.25, 0.25);
          ctx.audio.playFootstep(behind, s.intensity * 0.85, true);
          cueT = 0.5;
        }
        if (patch.isVisible) {
          cueT = Math.max(0, cueT - dt);
          const mat = patch.material;
          if (mat) mat.alpha = Math.min(1, cueT * 2) * 0.9;
        }
      },
      cleanup() {
        unsub();
        delaySamples.length = 0;
        patch.isVisible = false;
        if (patch.material) patch.material.alpha = 0;
      },
    };
  },
};
