/**
 * troffer.sparks — one troffer is dying. Its tube snaps between full
 * blaze and near-dark in irregular bursts, each snap accompanied by an
 * electric pop from the fixture. A dying tube you'd walk under. The
 * zone's other lamps stay steady. Moderate-unmistakable.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const trofferSparks: AnomalyDef = {
  id: "troffer.sparks",
  displayName: "The Dying Tube",
  chapter: 2,
  category: "lighting",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [20, 100],
  requires: ["light.zone.entry", "light.zone.gallery", "light.zone.clinic", "light.zone.junction"],
  excludes: ["troffer.falls", "light.flicker", "zone.pulse", "shaft.glow", "shaft.gone"],
  testSeed: "test.troffer.sparks",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zone = ctx.rng.pick(ctx.world.zones);
    const mesh = zone.troffers.length ? ctx.rng.pick(zone.troffers) : null;
    const baseMat = mesh?.material;
    if (!mesh || !(baseMat instanceof StandardMaterial)) return { update() {}, cleanup() {} };

    const clone = baseMat.clone("anomaly.troffer.sparks.mat");
    mesh.material = clone;
    const lit = clone.emissiveColor.clone();
    const dark = lit.scale(0.06);
    // nearest ceiling anchor point for the pops
    let popPos = mesh.position.clone();
    for (const a of ctx.world.anchors.troffers) {
      if (Vector3.Distance(a, mesh.position) < Vector3.Distance(popPos, mesh.position)) popPos = a;
    }

    let next = 0;
    let on = true;
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (t < next) return;
        // alternate lit/dark at irregular intervals; dark bursts pop
        on = !on;
        clone.emissiveColor.copyFrom(on ? lit : dark);
        if (!on) {
          ctx.audio.playPop(popPos, "a troffer snaps and pops");
          next = t + ctx.rng.range(0.04, 0.28); // snap off/short dark
        } else {
          next = t + ctx.rng.range(0.4, 2.4); // stretches of normal light
        }
      },
      cleanup() {
        mesh.material = baseMat;
        clone.dispose();
      },
    };
  },
};
