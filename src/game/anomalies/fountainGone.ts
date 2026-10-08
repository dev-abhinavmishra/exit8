/**
 * fountain.gone — the drinking fountain recessed by the east wall is
 * simply not there. Bare panels where the basin always stood. Subtle
 * object-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const fountainGone: AnomalyDef = {
  id: "fountain.gone",
  displayName: "Fountain Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["prop.fountain"],
  excludes: ["fountain.runs"],
  testSeed: "test.fountain.gone",
  dangerous: false,
  activate(ctx) {
    const node = ctx.world.registry.get("prop.fountain");
    node.setEnabled(false);
    return {
      update() {},
      cleanup() {
        node.setEnabled(true);
      },
    };
  },
};
