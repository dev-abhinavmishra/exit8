/**
 * troffer.falls — one ceiling light panel has broken loose from the
 * grid and hangs tilted into the corridor, still burning, swaying a
 * few degrees on its dead edge. Subtle at range, wrong overhead.
 * Object-class anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const trofferFalls: AnomalyDef = {
  id: "troffer.falls",
  displayName: "Ceiling Panel Hanging Loose",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["light.zone.gallery"],
  excludes: [
    "light.out",
    "light.red",
    "light.flicker",
    "light.follows",
    "shaft.glow",
    "zone.gallery",
    "zone.entry",
    "zone.clinic",
  ],
  testSeed: "test.troffer.falls",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { rng, world } = ctx;
    // any troffer in the three lit mid-zones — the junction reads by
    // its own lamps; a fallen panel there is invisible clutter
    const pool = world.zones.filter((z) => z.name !== "junction").flatMap((z) => z.troffers);
    const panel = rng.pick(pool);
    const tilt = rng.pick([-1, 1]) * rng.range(0.42, 0.6);
    const drop = rng.range(0.045, 0.075);
    const y0 = panel.position.y;
    panel.rotation.z = tilt;
    panel.position.y = y0 - drop;
    let t = rng.range(0, Math.PI * 2);
    return {
      update(dt) {
        t += dt;
        // a lazy sway on the free edge — slow enough to catch only
        // when you watch it, which is the point of a hanging panel
        panel.rotation.z = tilt + Math.sin(t * 0.7) * 0.045;
      },
      cleanup() {
        panel.rotation.z = 0;
        panel.position.y = y0;
      },
    };
  },
};
