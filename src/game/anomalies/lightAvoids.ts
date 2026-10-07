/**
 * light.avoids — one troffer in the gallery run sits dark while every
 * fixture around it stays lit. Subtle: a single dead rectangle in the
 * ceiling rhythm.
 */
import type { AnomalyDef } from "./types";

export const lightAvoids: AnomalyDef = {
  id: "light.avoids",
  displayName: "One Dead Troffer",
  chapter: 1,
  category: "lighting",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["light.zone.gallery"],
  excludes: ["zone.gallery"],
  testSeed: "test.light.avoids",
  dangerous: false,
  activate(ctx) {
    const zone = ctx.world.zones.find((z) => z.name === "gallery");
    if (!zone || zone.troffers.length === 0) return { update() {}, cleanup() {} };
    const victim = ctx.rng.pick(zone.troffers);
    const orig = victim.material;
    victim.material = ctx.world.materials.trofferDim;
    return {
      update() {},
      cleanup() {
        victim.material = orig;
      },
    };
  },
};
