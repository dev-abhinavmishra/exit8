/**
 * vent.slats — every louvre in one ceiling grille is gone. The duct
 * behind reads as a bare dark slot where the grille's steel comb
 * always sat. Look up or you won't catch it.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const ventSlats: AnomalyDef = {
  id: "vent.slats",
  displayName: "Bare Vent Grille",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["ceiling.vent.8", "ceiling.vent.24", "ceiling.vent.44"],
  excludes: ["ceiling"],
  testSeed: "test.vent.slats",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, rng } = ctx;
    const z = rng.pick([8, 24, 44]);
    const slats = [0, 1, 2, 3]
      .map((i) => scene.getMeshByName(`ceiling.vent.${z}.${i}`))
      .filter((m): m is NonNullable<typeof m> => m !== null);
    for (const s of slats) s.setEnabled(false);
    return {
      update() {},
      cleanup() {
        for (const s of slats) s.setEnabled(true);
      },
    };
  },
};
