/**
 * shaft.glow — one troffer panel goes dark, but the light shaft it
 * poured keeps hanging under it. A dead fixture still casting light.
 * Read together with light.delay it suggests the building's light is
 * only loosely attached to its fixtures.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const shaftGlow: AnomalyDef = {
  id: "shaft.glow",
  displayName: "Light Without A Source",
  chapter: 2,
  category: "lighting",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [12, 100],
  requires: ["light.zone.gallery", "light.zone.clinic"],
  excludes: ["light.out", "light.flicker", "light.delay", "light.avoids"],
  testSeed: "test.shaft.glow",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones.filter((z) => z.name === "gallery" || z.name === "clinic");
    const zone = ctx.rng.pick(zones);
    if (!zone || zone.shafts.length === 0) return { update() {}, cleanup() {} };
    const shaftNode = ctx.rng.pick(zone.shafts);
    const trofferName = shaftNode.name.slice(6); // "shaft." prefix
    const troffer = ctx.world.registry.mesh(trofferName);
    troffer.material = ctx.world.materials.trofferDim;
    return {
      update() {},
      cleanup() {
        troffer.material = ctx.world.materials.trofferLit;
      },
    };
  },
};
