/**
 * voice.near — once per loop, at a seeded moment on your walk, a breathy
 * exhale sounds from directly behind your shoulder. No body, no
 * footstep — just the breath. You have to have heard the corridor's
 * silences to know it does not belong. Moderate sound-class.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const voiceNear: AnomalyDef = {
  id: "voice.near",
  displayName: "Breath at Your Shoulder",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: [],
  excludes: ["echo.steps", "horn.crackle", "announce.spatial"],
  testSeed: "test.voice.near",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { rng } = ctx;
    // trigger once, at a seeded point mid-corridor the player must pass
    const triggerZ = rng.range(9, 48);
    const sideJitter = rng.range(-0.45, 0.45);
    let armed = true;
    let prevZ = ctx.player.position.z;
    return {
      update() {
        const p = ctx.player.position;
        const dir = p.z - prevZ; // travel direction along the corridor
        prevZ = p.z;
        if (!armed) return;
        if (Math.abs(p.z - triggerZ) < 0.5 && Math.abs(dir) > 0.0005) {
          armed = false;
          // behind = back along the way the player came
          const behind = new Vector3(p.x + sideJitter, 1.55, p.z - Math.sign(dir) * 0.8);
          ctx.audio.playBreath(behind);
        }
      },
      cleanup() {},
    };
  },
};
