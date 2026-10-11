/**
 * bayplate.gone — one of the six records-bank label plates is simply
 * not there: brass frame and its pale slip both absent, bare cabinet
 * face where the bay tag sat. Subtle — a missing line in a sequence.
 */
import type { AnomalyDef } from "./types";

const ZS = [15.5, 18.5, 21.5, 24.5, 27.5, 30.5] as const;

export const bayplateGone: AnomalyDef = {
  id: "bayplate.gone",
  displayName: "Missing Bay Plate",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ZS.flatMap((z) => [`bay.plate.${z}`, `bay.plate.${z}.slip`]),
  excludes: [],
  testSeed: "test.bayplate.gone",
  dangerous: false,
  activate(ctx) {
    const z = ZS[Math.floor(ctx.rng.draw() * ZS.length)]!;
    const parts = [`bay.plate.${z}`, `bay.plate.${z}.slip`]
      .map((n) => ctx.world.registry.get(n))
      .filter((m): m is NonNullable<typeof m> => m != null);
    for (const p of parts) p.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const p of parts) p.setEnabled(true);
      },
    };
  },
};
