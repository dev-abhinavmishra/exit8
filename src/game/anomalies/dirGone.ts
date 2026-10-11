/**
 * dir.gone — the ROUTE DIRECTORY wall sign over the radiator is simply
 * not there; bare tile where the wayfinding panel hung. Subtle — a
 * missing answer on the wall that usually has one.
 */
import type { AnomalyDef } from "./types";

export const dirGone: AnomalyDef = {
  id: "dir.gone",
  displayName: "Directory Sign Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["sign.sign.directory"],
  excludes: ["sign.flip", "sign.wrongway", "sign.mirror"],
  testSeed: "test.dir.gone",
  dangerous: false,
  activate(ctx) {
    const sign = ctx.world.registry.get("sign.sign.directory");
    if (!sign) return { update() {}, cleanup() {} };
    sign.setEnabled(false);
    return {
      update() {},
      cleanup() {
        sign.setEnabled(true);
      },
    };
  },
};
