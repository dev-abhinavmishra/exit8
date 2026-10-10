import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * commuter.bench — he is on the NORTH bench tonight instead of his
 * usual seat — same pose, same paper, wrong spot. Moderate.
 */
export const commuterBench: AnomalyDef = {
  id: "commuter.bench",
  displayName: "Wrong Bench Tonight",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.upright", "commuter.stare"],
  testSeed: "test.commuter.bench",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    const g = c.root;
    g.setEnabled(true);
    g.position.set(-1.3, 0.42, 16.4);
    g.rotation.set(0, Math.PI / 2 - 0.15, 0);
    return {
      update() {},
      cleanup() {
        c.reset(was);
      },
    };
  },
};
