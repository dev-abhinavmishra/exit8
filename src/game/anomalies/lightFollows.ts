/**
 * light.follows — the corridor only keeps light where you stand. The
 * zone you step out of dies the instant you leave it; looking back is
 * looking into dark. Re-enter a dead zone and it lights again — the
 * corridor is always exactly one zone deep around you.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";
import type { LightZone } from "../../world/generation/concourse";

export const lightFollows: AnomalyDef = {
  id: "light.follows",
  displayName: "One Zone Of Light",
  chapter: 3,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [45, 100],
  requires: ["light.zone.entry", "light.zone.junction"],
  excludes: ["zone.gallery", "zone.clinic", "light", "shaft"],
  testSeed: "test.light.follows",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones;
    const bases = new Map<LightZone, number>();
    for (const z of zones) bases.set(z, z.point.intensity);
    const extraBases = new Map(zones.map((z) => [z, z.extraLights.map((l) => l.intensity)]));
    const lit = new Set<LightZone>(zones);
    let prevZone: LightZone | undefined;

    const setLit = (zone: LightZone, on: boolean) => {
      zone.point.intensity = on ? bases.get(zone)! : bases.get(zone)! * 0.08;
      zone.extraLights.forEach(
        (l, i) => (l.intensity = (extraBases.get(zone)![i] ?? l.intensity) * (on ? 1 : 0.08)),
      );
      const mat = on ? ctx.world.materials.trofferLit : ctx.world.materials.trofferDim;
      for (const tr of zone.troffers) tr.material = mat;
      for (const s of zone.shafts) s.setEnabled(on);
    };

    return {
      update() {
        const pz = ctx.player.position.z;
        const cur = zones.find((z) => pz >= z.z0 && pz < z.z1);
        if (!cur || cur === prevZone) return;
        if (prevZone && lit.has(prevZone)) {
          setLit(prevZone, false);
          lit.delete(prevZone);
        }
        if (!lit.has(cur)) {
          setLit(cur, true);
          lit.add(cur);
        }
        prevZone = cur;
      },
      cleanup() {
        for (const z of zones) {
          if (!lit.has(z)) setLit(z, true);
        }
        lit.clear();
      },
    };
  },
};
