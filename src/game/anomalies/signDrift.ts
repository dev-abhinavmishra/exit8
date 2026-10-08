/**
 * sign.drift — one of the two big wall signs has slid half a metre down
 * and settled at a slight cant. Subtle; the wall reads "off" before it
 * reads "wrong".
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const signDrift: AnomalyDef = {
  id: "sign.drift",
  displayName: "Sign Has Slipped",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["sign.sign.gallery", "sign.sign.clinic"],
  excludes: ["signage.wall"],
  testSeed: "test.sign.drift",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    // kit.wallSign registers sign.${specId}; specIds already carry the prefix
    const sign = ctx.world.registry.mesh(ctx.rng.pick(["sign.sign.gallery", "sign.sign.clinic"]));
    const y0 = sign.position.y;
    const rz0 = sign.rotation.z;
    sign.position.y = y0 - 0.55;
    sign.rotation.z = rz0 + 0.045;
    return {
      update() {
        // static swap — nothing animates
      },
      cleanup() {
        sign.position.y = y0;
        sign.rotation.z = rz0;
      },
    };
  },
};
