import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * commuter.down — he is still on the bench but slumped forward off
 * the seat back, chin buried, one arm hanging. Unmistakable.
 */
export const commuterDown: AnomalyDef = {
  id: "commuter.down",
  displayName: "Slumped On The Bench",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.75,
  progressionRange: [35, 100],
  requires: ["commuter"],
  excludes: ["commuter.upright", "commuter.stare", "corridor.slump"],
  testSeed: "test.commuter.down",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    const g = c.root;
    g.setEnabled(true);
    g.rotation.x = 0.55;
    g.position.set(-1.28, 0.32, 33.32);
    c.fig.headPivot.rotation.set(0.9, 0.1, 0.12);
    c.fig.arms[0]!.rotation.x = 0.5;
    c.fig.arms[1]!.rotation.x = 0.15;
    return {
      update() {},
      cleanup() {
        c.reset(was);
      },
    };
  },
};
