/**
 * blinds.open — the venetian blind that is always drawn over one
 * gallery bay is open. That stretch of glass now reads the room like
 * every other bay — a quiet deletion on a detail most players learn
 * without naming it. Subtle: one familiar obstruction gone.
 */
import type { AnomalyDef } from "./types";

export const blindsOpen: AnomalyDef = {
  id: "blinds.open",
  displayName: "The Blind Is Open",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [10, 100],
  requires: ["wall.gallery.blind"],
  excludes: ["gallery.frost", "depth.mismatch", "gallery.occupied", "blinds"],
  testSeed: "test.blinds.open",
  dangerous: false,
  activate(ctx) {
    const blind = ctx.world.registry.mesh("wall.gallery.blind");
    blind.setEnabled(false);
    return {
      update() {},
      cleanup() {
        blind.setEnabled(true);
      },
    };
  },
};
