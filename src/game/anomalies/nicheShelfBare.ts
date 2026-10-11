/**
 * niche.shelf.bare — the nook's shelf is empty: thermos and lunch
 * parcel both gone. The jacket still hangs — the person packed up
 * and left mid-shift, or never arrived.
 */
import type { AnomalyDef } from "./types";

export const nicheShelfBare: AnomalyDef = {
  id: "niche.shelf.bare",
  displayName: "Shelf Cleared Out",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [10, 100],
  requires: ["niche.thermos", "niche.lunch"],
  excludes: ["niche.thermos.steam"],
  testSeed: "test.niche.shelf.bare",
  dangerous: false,
  activate(ctx) {
    const gone = ["niche.thermos", "niche.lunch"]
      .map((n) => ctx.world.registry.get(n))
      .filter((m): m is NonNullable<typeof m> => !!m);
    for (const m of gone) m.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const m of gone) m.setEnabled(true);
      },
    };
  },
};
