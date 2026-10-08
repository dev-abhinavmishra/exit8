/**
 * totem.sways — the SERVICE JUNCTION totem swings gently on its hangers,
 * a slow pendulum that never quite stops. Subtle: signage in this
 * corridor hangs dead still.
 */
import type { AnomalyDef } from "./types";

export const totemSways: AnomalyDef = {
  id: "totem.sways",
  displayName: "Swinging Junction Totem",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["sign.sign.junction"],
  excludes: ["sign.motion"],
  testSeed: "test.totem.sways",
  dangerous: false,
  activate(ctx) {
    const sign = ctx.world.registry.mesh("sign.sign.junction");
    const rz0 = sign.rotation.z;
    const amp = ctx.rng.range(0.05, 0.09);
    const period = ctx.rng.range(2.4, 3.2);
    let t = 0;
    return {
      update(dt) {
        t += dt;
        sign.rotation.z = rz0 + amp * Math.sin((t / period) * Math.PI * 2) * Math.exp(-t * 0.004);
      },
      cleanup() {
        sign.rotation.z = rz0;
      },
    };
  },
};
