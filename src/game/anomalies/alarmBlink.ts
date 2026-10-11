import { Color3 } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef } from "./types";

/**
 * alarm.blink — a pin of red blinks inside the station's face, the
 * kind of heartbeat blink alarm panels give when they're already
 * tripped. Slow, regular, wrong.
 */
export const alarmBlink: AnomalyDef = {
  id: "alarm.blink",
  displayName: "It Is Blinking",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["alarm"],
  excludes: ["alarm.gone"],
  testSeed: "test.alarm.blink",
  dangerous: false,
  activate(ctx) {
    const mat = ctx.scene.getMaterialByName("mat.alarm") as StandardMaterial | null;
    if (!mat) return { update() {}, cleanup() {} };
    const saved = mat.emissiveColor.clone();
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const on = Math.sin(t * 2.4) > 0.6;
        mat.emissiveColor = on ? new Color3(0.85, 0.1, 0.05) : saved;
      },
      cleanup() {
        mat.emissiveColor = saved;
      },
    };
  },
};
