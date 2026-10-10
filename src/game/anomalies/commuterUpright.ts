import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * commuter.upright — the commuter is standing mid-corridor now, arms
 * slack, facing up-route toward whoever walks in. Unmistakable.
 */
export const commuterUpright: AnomalyDef = {
  id: "commuter.upright",
  displayName: "He Is Standing",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["commuter"],
  excludes: ["commuter.stare", "commuter.down", "commuter.gone.paper"],
  testSeed: "test.commuter.upright",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    const g = c.root;
    g.setEnabled(true);
    c.fig.hips[0]!.rotation.x = 0;
    c.fig.hips[1]!.rotation.x = 0;
    c.fig.arms[0]!.rotation.x = 0;
    c.fig.arms[1]!.rotation.x = 0;
    c.fig.headPivot.rotation.set(0.04, 0, 0);
    g.position.set(-0.3, 0, 30.5); // west of the walker's patrol lane
    g.rotation.set(0, Math.PI, 0);
    return {
      update() {},
      cleanup() {
        c.reset(was);
      },
    };
  },
};
