/**
 * counter.bell — the service bell on the clinic counter rings once,
 * on its own, while you're anywhere in the corridor — and it keeps
 * swaying for a second after. Nobody is at the counter to press it.
 */
import type { AnomalyDef } from "./types";

export const counterBell: AnomalyDef = {
  id: "counter.bell",
  displayName: "The Bell Rings Itself",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [8, 100],
  requires: ["clinic.counter"],
  excludes: ["bell.gone", "phone.rings", "pa.deadair"],
  testSeed: "test.counter.bell",
  dangerous: false,
  activate(ctx) {
    const { scene, rng } = ctx;
    const bell = scene.getMeshByName("clinic.counter.bell");
    if (!bell) return { update() {}, cleanup() {} };
    const pos = bell.getAbsolutePosition().clone();
    const delay = rng.range(6, 14);
    let t = 0;
    let rang = false;
    let wob = 0;
    const rot0 = bell.rotation.clone();
    return {
      update(dt) {
        if (!rang && (t += dt) >= delay) {
          rang = true;
          ctx.audio.playDing(pos);
          wob = 1.4;
        }
        if (wob > 0) {
          wob -= dt;
          bell.rotation.z = rot0.z + Math.sin(wob * 28) * 0.07 * Math.min(1, wob);
          if (wob <= 0) bell.rotation.copyFrom(rot0);
        }
      },
      cleanup() {
        bell.rotation.copyFrom(rot0);
      },
    };
  },
};
