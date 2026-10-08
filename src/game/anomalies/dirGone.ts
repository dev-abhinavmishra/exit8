/**
 * dir.gone — the ROUTE DIRECTORY wall sign in the first stretch is
 * simply not there. Bare wall where the directory always hung.
 * Subtle object-class anomaly.
 */
import type { AnomalyDef } from "./types";

const SPEC_ID = "sign.directory";

export const dirGone: AnomalyDef = {
  id: "dir.gone",
  displayName: "Directory Sign Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["sign", "sign.drift", "sign.ghost"],
  testSeed: "test.dir.gone",
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
