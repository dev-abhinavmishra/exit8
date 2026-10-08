/**
 * prop.displaced — the fire cabinet has migrated across the corridor:
 * right wall z≈18 → left wall. Moderate — a red box on the wrong side.
 */
import type { AnomalyDef } from "./types";

export const propDisplaced: AnomalyDef = {
  id: "prop.displaced",
  displayName: "Displaced Fire Cabinet",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["fireCabinet"],
  excludes: ["prop.cabinet"],
  testSeed: "test.prop.displaced",
  dangerous: false,
  activate(ctx) {
    const cab = ctx.world.registry.mesh("fireCabinet");
    const x0 = cab.position.x;
    const ry0 = cab.rotation.y;
    cab.position.x = -x0;
    cab.rotation.y = ry0 + Math.PI;
    return {
      update() {},
      cleanup() {
        cab.position.x = x0;
        cab.rotation.y = ry0;
      },
    };
  },
};
