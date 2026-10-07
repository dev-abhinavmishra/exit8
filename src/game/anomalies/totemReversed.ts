/**
 * totem.reversed — the hanging totem at z=12 has been turned around.
 * Approaching from the north you meet its blank steel back; the
 * ARCHIVES face now reads to nobody, down at the records wall.
 */
import type { AnomalyDef } from "./types";

export const totemReversed: AnomalyDef = {
  id: "totem.reversed",
  displayName: "Reversed Totem",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["sign.sign.totem.north"],
  excludes: ["totem", "sign"],
  testSeed: "test.totem.reversed",
  dangerous: false,
  activate(ctx) {
    const panel = ctx.world.registry.get("sign.sign.totem.north") as {
      rotation: { y: number };
    };
    const home = panel.rotation.y;
    panel.rotation.y = home + Math.PI;
    return {
      update() {},
      cleanup() {
        panel.rotation.y = home;
      },
    };
  },
};
