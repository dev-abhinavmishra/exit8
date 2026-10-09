/**
 * light.delay — the lights answer your passage ~1.5 s late. Cross a zone
 * boundary and nothing happens; a beat after you've moved on, the zone
 * you LEFT drops dark, holds a moment, relights. The corridor is
 * reacting to where you were, not where you are. Moderate.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";
import type { LightZone } from "../../world/generation/concourse";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";

const LAG_S = 1.5;
const DARK_S = 1.0;

export const lightDelay: AnomalyDef = {
  id: "light.delay",
  displayName: "Lights A Step Behind",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [0, 100],
  requires: ["light.zone.entry", "light.zone.junction"],
  excludes: ["zone.gallery", "zone.clinic"],
  testSeed: "test.light.delay",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones;
    let t = 0;
    let prevZone: LightZone | undefined;
    let pending: { zone: LightZone; at: number } | null = null;
    let dimmed: { zone: LightZone; base: number; restoreAt: number } | null = null;
    // extras dim proportionally with their zone — snapshot bases once
    const exBase = new Map<PointLight, number>();
    for (const z of zones) for (const l of z.extraLights) exBase.set(l, l.intensity);

    const setLit = (zone: LightZone, lit: boolean, base: number) => {
      zone.point.intensity = lit ? base : base * 0.12;
      for (const l of zone.extraLights) {
        const eb = exBase.get(l) ?? 0;
        l.intensity = lit ? eb : eb * 0.12;
      }
      const mat = lit ? ctx.world.materials.trofferLit : ctx.world.materials.trofferDim;
      for (const tr of zone.troffers) tr.material = mat;
      for (const s of zone.shafts) s.setEnabled(lit);
    };

    return {
      update(dt) {
        t += dt;
        const pz = ctx.player.position.z;
        const cur = zones.find((z) => pz >= z.z0 && pz < z.z1);
        if (cur && prevZone && cur !== prevZone && !pending && !dimmed) {
          // crossing detected — the zone just left will die LATE
          pending = { zone: prevZone, at: t + LAG_S };
        }
        if (cur) prevZone = cur;
        if (pending && t >= pending.at) {
          const zone = pending.zone;
          pending = null;
          dimmed = { zone, base: zone.point.intensity, restoreAt: t + DARK_S };
          setLit(zone, false, 0);
        }
        if (dimmed && t >= dimmed.restoreAt) {
          setLit(dimmed.zone, true, dimmed.base);
          dimmed = null;
        }
      },
      cleanup() {
        if (dimmed) setLit(dimmed.zone, true, dimmed.base);
      },
    };
  },
};
