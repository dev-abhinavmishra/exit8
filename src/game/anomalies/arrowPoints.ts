/**
 * arrow.points — one worn route decal points the wrong way: repainted
 * or turned overnight, its chevron now aims north, back at the intake,
 * while the pair flanking it still point south. Subtle — a single
 * rotated mark in a sequence of six.
 */
import type { AnomalyDef } from "./types";

export const arrowPoints: AnomalyDef = {
  id: "arrow.points",
  displayName: "Arrow Points North",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: [
    "route.decal.0",
    "route.decal.1",
    "route.decal.2",
    "floor.arrow.10",
    "floor.arrow.30",
    "floor.arrow.48",
  ],
  excludes: ["arrows.gone", "arrow.extra", "sign.wrongway", "exit.wrongway"],
  testSeed: "test.arrow.points",
  dangerous: false,
  activate(ctx) {
    const names = [
      "route.decal.0",
      "route.decal.1",
      "route.decal.2",
      "floor.arrow.10",
      "floor.arrow.30",
      "floor.arrow.48",
    ];
    const i = Math.floor(ctx.rng.draw() * names.length);
    const decal = ctx.world.registry.get(names[i]!);
    if (!decal) return { update() {}, cleanup() {} };
    // flip the painted arrow to point north
    decal.rotation.z = 0;
    return {
      update() {},
      cleanup() {
        decal.rotation.z = Math.PI;
      },
    };
  },
};
