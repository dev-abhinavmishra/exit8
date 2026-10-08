/**
 * shaft.gone — one troffer keeps burning but its light shaft never
 * falls. The eye isn't drawn — the lamp is lit — but the air under it
 * is empty. The inverse of shaft.glow.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const shaftGone: AnomalyDef = {
  id: "shaft.gone",
  displayName: "Light Without Air",
  chapter: 2,
  category: "lighting",
  detectability: "subtle",
  weight: 0.6,
  progressionRange: [15, 100],
  requires: ["light.zone.gallery", "light.zone.clinic"],
  excludes: ["light.out", "light.flicker", "light.avoids", "shaft.glow", "shaft.mirror"],
  testSeed: "test.shaft.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones.filter((z) => z.name === "gallery" || z.name === "clinic");
    const zone = ctx.rng.pick(zones);
    if (!zone || zone.shafts.length === 0) return { update() {}, cleanup() {} };
    const shaft = ctx.rng.pick(zone.shafts);
    shaft.setEnabled(false);
    return {
      update() {},
      cleanup() {
        shaft.setEnabled(true);
      },
    };
  },
};
