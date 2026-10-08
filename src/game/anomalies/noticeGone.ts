/**
 * notice.gone — the DIVERGENCE POINT sign overhead inside the north
 * airlock is simply not there; bare lintel where the turn-back board
 * hung. Subtle spatial-class anomaly.
 */
import type { AnomalyDef } from "./types";

export const noticeGone: AnomalyDef = {
  id: "notice.gone",
  displayName: "North Vestibule Sign Missing",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["sign.sign.diverge.north"],
  excludes: ["sign", "notice.amends"],
  testSeed: "test.notice.gone",
  dangerous: false,
  activate(ctx) {
    const mesh = ctx.world.registry.mesh("sign.sign.diverge.north");
    mesh.setEnabled(false);
    return {
      update() {},
      cleanup() {
        mesh.setEnabled(true);
      },
    };
  },
};
