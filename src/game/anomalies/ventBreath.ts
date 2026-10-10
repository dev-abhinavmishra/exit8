import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * vent.breath — the west floor vent at z20.5 breathes: its slats pulse
 * open and shut, slow, like a chest. Moderate, audio-adjacent.
 */
export const ventBreath: AnomalyDef = {
  id: "vent.breath",
  displayName: "The Vent Is Breathing",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["svc.vent.1.slat.0"],
  excludes: ["stain.grown"],
  testSeed: "test.vent.breath",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const slats = [0, 1, 2, 3].map((i) => world.registry.mesh(`svc.vent.1.slat.${i}`)).filter(Boolean);
    let t = 0;
    let sighed = false;
    return {
      update(_dt: number) {
        t += _dt;
        const open = (Math.sin(t * 1.4) + 1) / 2;
        slats.forEach((s, i) => {
          s.rotation.x = open * 0.85 - i * 0.03;
        });
        if (!sighed && t > 2.5) {
          sighed = true;
          ctx.audio.caption("the vent is breathing", null);
        }
      },
      cleanup() {
        slats.forEach((s) => (s.rotation.x = 0));
      },
    };
  },
};
