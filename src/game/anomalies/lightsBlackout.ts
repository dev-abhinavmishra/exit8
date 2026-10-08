/**
 * lights.blackout — the corridor feed dies, one breaker at a time,
 * rolling north-to-south. What remains is the warm airlock pool at the
 * far end — and someone is standing in it.
 *
 * The fourth dangerous model: not a chase, a standoff. The figure
 * never advances; it waits, backlit, while you decide whether the dark
 * is worth crossing. Close on it and its head finds you — push within
 * arm's reach and it costs stability. The right play is to turn back
 * and file it, not to inspect the dark.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { LightZone } from "../../world/generation/concourse";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

const FIG_Z = 49.0; // inside the junction mouth, rimmed by the south airlock pool
const NOTICE_M = 15; // first "someone is standing in the dark" sightline
const TURN_M = 6.5; // its head finds you
const CONTACT_M = 2.2; // arm's reach — don't inspect the dark

export const lightsBlackout: AnomalyDef = {
  id: "lights.blackout",
  displayName: "Someone Is In The Dark",
  chapter: 3,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.45,
  progressionRange: [55, 100],
  requires: ["light.zone.entry", "light.zone.gallery", "light.zone.clinic", "light.zone.junction"],
  excludes: ["light", "shaft", "figure", "walker.crowd", "zone.gallery", "zone.clinic"],
  testSeed: "test.lights.blackout",
  dangerous: true,
  activate(ctx) {
    const world = ctx.world;
    const zones = world.zones;
    const bases = new Map<LightZone, number>();
    for (const z of zones) bases.set(z, z.point.intensity);
    const hemiBase = world.hemi.intensity;

    const setLit = (zone: LightZone, on: boolean) => {
      zone.point.intensity = on ? bases.get(zone)! : bases.get(zone)! * 0.05;
      const mat = on ? world.materials.trofferLit : world.materials.trofferDim;
      for (const tr of zone.troffers) tr.material = mat;
      for (const s of zone.shafts) s.setEnabled(on);
    };

    const fig = buildFigure(ctx.scene, world.root, "anomaly.lights.blackout", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const g = fig.root;
    g.position.set(0.12, 0, FIG_Z);
    g.rotation.y = Math.PI; // it faces north — whoever comes down the corridor

    let t = 0;
    let killed = 0;
    let seen = false;
    let turning = false;
    let gone = false;

    return {
      update(dt) {
        t += dt;
        // breakers drop one zone at a time — the dark rolls down the
        // corridor toward the far end where the figure is waiting
        while (killed < zones.length && t > 0.5 + killed * 0.34) {
          const z = zones[killed]!;
          setLit(z, false);
          ctx.audio.playPop(
            new Vector3(0, 2.6, (z.z0 + z.z1) / 2),
            killed === 0 ? "a breaker drops — the feed is going zone by zone" : "",
          );
          killed++;
        }
        if (killed >= zones.length) world.hemi.intensity = Math.max(0.22, world.hemi.intensity - dt * 3);
        if (gone) return;

        const pp = ctx.player.position;
        const dx = g.position.x - pp.x;
        const dz = g.position.z - pp.z;
        const dist = Math.hypot(dx, dz);
        if (!seen && dist < NOTICE_M) {
          seen = true;
          ctx.audio.caption("someone is standing in the dark", g.position.clone());
        }
        if (!turning && dist < TURN_M) {
          turning = true;
          ctx.audio.caption("its head turns", null);
        }
        if (turning) {
          // head tracks you — a slow find, clamped so it can't owl-spin
          const want = Math.atan2(pp.x - g.position.x, pp.z - g.position.z) - Math.PI;
          const wrapped = Math.atan2(Math.sin(want), Math.cos(want));
          const clamped = Math.max(-1.25, Math.min(1.25, wrapped));
          const cur = fig.headPivot.rotation.y;
          fig.headPivot.rotation.y = cur + (clamped - cur) * Math.min(1, dt * 4.5);
        }
        if (dist < CONTACT_M) {
          gone = true;
          fig.headPivot.rotation.y = Math.atan2(
            Math.sin(Math.atan2(pp.x - g.position.x, pp.z - g.position.z) - Math.PI),
            Math.cos(Math.atan2(pp.x - g.position.x, pp.z - g.position.z) - Math.PI),
          );
          g.setEnabled(false);
          ctx.penalize?.(5);
          ctx.player.jolt(0.8);
          ctx.audio.playGroan(g.position.clone(), "it was right there — it isn't now");
        }
      },
      cleanup() {
        for (const z of zones) setLit(z, true);
        world.hemi.intensity = hemiBase;
        g.dispose();
      },
    };
  },
};
