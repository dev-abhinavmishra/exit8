/**
 * phone.dialtone — the corridor phone is a dead internal handset; this
 * loop it is emitting a dial tone. Nothing to see — you hear it when
 * you stand beside the niche. Subtle: pure audio.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const PHONE = new Vector3(1.75, 1.45, 13.2);

export const phoneDialtone: AnomalyDef = {
  id: "phone.dialtone",
  displayName: "Dial Tone",
  chapter: 1,
  category: "sound",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["prop.phone"],
  excludes: ["phone.gone", "phone.rings", "phone.offhook", "phone.lit"],
  testSeed: "test.phone.dialtone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const stop = ctx.audio.startDialTone(PHONE);
    let heard = false;
    return {
      update() {
        if (heard) return;
        const p = ctx.player.position;
        const dx = p.x - PHONE.x;
        const dz = p.z - PHONE.z;
        if (dx * dx + dz * dz < 2.2 * 2.2) {
          heard = true;
          ctx.audio.caption("a dial tone, from a dead line", PHONE);
        }
      },
      cleanup() {
        stop();
      },
    };
  },
};
