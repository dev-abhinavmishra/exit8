/**
 * pitch.sags — the junction machinery thrum drifts flat over the loop,
 * a slow quarter-tone sag that never resolves. Nothing you can point
 * at; the whole corridor just sounds tired. Subtle systemic anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const pitchSags: AnomalyDef = {
  id: "pitch.sags",
  displayName: "The Hum Sags",
  chapter: 2,
  category: "sound",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["junction.machine"],
  excludes: ["machine.silence"],
  testSeed: "test.pitch.sags",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    let t = 0;
    let announced = false;
    return {
      update(dt) {
        t += dt;
        // ~12% sag over ~80s, then holds — the building stays tired
        const sag = Math.min(0.12, t * 0.0015);
        ctx.audio.setMachinePitch(() => 1 - sag);
        if (!announced && sag > 0.06) {
          announced = true;
          ctx.audio.caption("the machinery hum sags flat", null);
        }
      },
      cleanup() {
        ctx.audio.setMachinePitch(null);
      },
    };
  },
};
