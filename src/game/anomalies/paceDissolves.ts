/**
 * pace.dissolves — the corridor hasn't stretched; the walk has. Inside
 * the mid-span your pace bleeds to a little over half and your own
 * footstep cadence drags with it — the loop takes longer than it ever
 * has. Moderate: you feel it in the legs before you can name it.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

const Z0 = 16;
const Z1 = 48;
const SLOW = 0.55;
const EASE = 0.32; // per-second exponential approach

export const paceDissolves: AnomalyDef = {
  id: "pace.dissolves",
  displayName: "The Walk Takes Longer",
  chapter: 2,
  category: "systemic",
  detectability: "moderate",
  weight: 0.65,
  progressionRange: [20, 100],
  requires: ["floor"],
  excludes: [],
  testSeed: "test.pace.dissolves",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    let k = 1;
    return {
      update(dt) {
        const pz = ctx.player.position.z;
        const target = pz > Z0 && pz < Z1 ? SLOW : 1;
        k += (target - k) * Math.min(1, EASE * dt);
        ctx.player.speedScale = k;
      },
      cleanup() {
        ctx.player.speedScale = 1;
      },
    };
  },
};
