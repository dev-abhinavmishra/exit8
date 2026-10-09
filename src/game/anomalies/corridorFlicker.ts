/**
 * corridor.flicker — the whole corridor gutters: a rolling fluorescent
 * failure travels zone to zone, lights choking and snapping back in
 * phase so the dark moves down the passage ahead of you. The zones
 * still burn — they're just fighting to. Unmistakable the moment you
 * look anywhere.
 */
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { LightZone } from "../../world/generation/concourse";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const corridorFlicker: AnomalyDef = {
  id: "corridor.flicker",
  displayName: "The Corridor Chokes",
  chapter: 3,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [8, 100],
  requires: [],
  excludes: ["lights.blackout", "light.delay", "zone.gallery", "zone.clinic"],
  testSeed: "test.corridor.flicker",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones;
    const base = zones.map((z) => z.point.intensity);
    const exBase = new Map<PointLight, number>();
    for (const z of zones) for (const l of z.extraLights) exBase.set(l, l.intensity);

    const flick = (z: LightZone, i: number, v: number) => {
      const k = 0.16 + 0.84 * v;
      z.point.intensity = base[i]! * k;
      for (const l of z.extraLights) l.intensity = (exBase.get(l) ?? 0) * k;
      const lit = v > 0.42;
      const mat = lit ? ctx.world.materials.trofferLit : ctx.world.materials.trofferDim;
      for (const tr of z.troffers) tr.material = mat;
      for (const s of z.shafts) s.setEnabled(v > 0.3);
    };

    let t = 0;
    return {
      update(dt) {
        t += dt;
        zones.forEach((z, i) => {
          // fluorescent struggle — two beating sines, phase offset per
          // zone so the dark travels down the passage
          const v = Math.abs(Math.sin(t * 9.5 - i * 2.1) * Math.sin(t * 3.7 + i * 1.4));
          flick(z, i, v);
        });
      },
      cleanup() {
        zones.forEach((z, i) => {
          z.point.intensity = base[i]!;
          for (const l of z.extraLights) l.intensity = exBase.get(l) ?? 0;
          for (const tr of z.troffers) tr.material = ctx.world.materials.trofferLit;
          for (const s of z.shafts) s.setEnabled(true);
        });
      },
    };
  },
};
