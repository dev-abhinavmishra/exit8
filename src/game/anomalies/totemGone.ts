/**
 * totem.gone — the mid-route hanging totem, the INSPECTION LOOP 7
 * sign you clock every pass, is simply not there. Empty rod over the
 * corridor. Moderate spatial-class anomaly.
 */
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.totem.mid";

export const totemGone: AnomalyDef = {
  id: "totem.gone",
  displayName: "Totem Sign Missing",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "totem.reversed", "sign.loop8", "totem.sways"],
  testSeed: "test.totem.gone",
  dangerous: false,
  activate(ctx) {
    const mesh = ctx.world.registry.mesh(`sign.${SPEC_ID}`);
    mesh.setEnabled(false);
    return {
      update() {},
      cleanup() {
        mesh.setEnabled(true);
      },
    };
  },
};
