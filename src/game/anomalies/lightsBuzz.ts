/**
 * lights.buzz — one troffer's ballast starts chattering: a mains hum
 * with a slow flutter, looped until you file a judgment. It never
 * flickers — the light is fine, the SOUND is wrong. Moderate: loud
 * once you're under it, easy to miss at distance.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const lightsBuzz: AnomalyDef = {
  id: "lights.buzz",
  displayName: "Chattering Ballast",
  chapter: 1,
  category: "sound",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [0, 100],
  requires: ["light.zone.entry", "light.zone.gallery"],
  excludes: ["light.out", "light.flicker", "pitch.sags", "machine.silence"],
  testSeed: "test.lights.buzz",
  dangerous: false,
  activate(ctx) {
    const zones = ctx.world.zones.filter((z) => z.name === "entry" || z.name === "gallery");
    const zone = ctx.rng.pick(zones);
    const mesh = zone && ctx.rng.pick(zone.troffers);
    if (!mesh) return { update() {}, cleanup() {} };
    const pos = mesh.getAbsolutePosition().clone();
    const buzz = ctx.audio.createBuzz(new Vector3(pos.x, pos.y - 0.1, pos.z));
    const delay = ctx.rng.range(5, 11);
    let t = 0;
    let started = false;
    return {
      update(dt) {
        if (!started && (t += dt) >= delay) {
          buzz.start();
          started = true;
        }
      },
      cleanup() {
        buzz.stop();
      },
    };
  },
};
