/**
 * light.flicker — the gallery zone's troffers strobe on a seeded irregular
 * cadence. Moderate: obvious in peripheral vision, easy to second-guess.
 */
import type { AnomalyDef } from "./types";

export const lightFlicker: AnomalyDef = {
  id: "light.flicker",
  displayName: "Stuttering Troffers",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["light.zone.gallery"],
  excludes: ["zone.gallery"],
  testSeed: "test.light.flicker",
  dangerous: false,
  activate(ctx) {
    const zone = ctx.world.zones.find((z) => z.name === "gallery");
    if (!zone) return { update() {}, cleanup() {} };
    const base = zone.point.intensity;
    // deterministic stutter pattern: alternating on/off interval lengths
    const spans: number[] = [];
    for (let i = 0; i < 48; i++) spans.push(ctx.rng.range(0.04, 0.42));
    let spanIdx = 0;
    let spanT = 0;
    let lit = true;
    const apply = () => {
      zone.point.intensity = lit ? base : base * 0.08;
      const mat = lit ? ctx.world.materials.trofferLit : ctx.world.materials.trofferDim;
      for (const t of zone.troffers) t.material = mat;
      for (const s of zone.shafts) s.setEnabled(lit);
    };
    return {
      update(dt) {
        spanT += dt;
        const span = spans[spanIdx % spans.length] ?? 0.2;
        if (spanT >= span) {
          spanT = 0;
          spanIdx += 1;
          lit = !lit;
          apply();
        }
      },
      cleanup() {
        zone.point.intensity = base;
        for (const t of zone.troffers) t.material = ctx.world.materials.trofferLit;
        for (const s of zone.shafts) s.setEnabled(true);
      },
    };
  },
};
