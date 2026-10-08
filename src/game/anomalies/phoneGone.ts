/**
 * phone.gone — the corridor phone on the west wall, handset and all,
 * is simply not there. The wall plate it hung on is bare. Subtle
 * object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const phoneGone: AnomalyDef = {
  id: "phone.gone",
  displayName: "Phone Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["prop.phone"],
  excludes: ["phone.offhook"],
  testSeed: "test.phone.gone",
  dangerous: false,
  activate(ctx) {
    const node = ctx.world.registry.get("prop.phone");
    node.setEnabled(false);
    return {
      update() {},
      cleanup() {
        node.setEnabled(true);
      },
    };
  },
};
