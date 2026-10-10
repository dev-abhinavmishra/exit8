import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * commuter.stare — he never looks away: seated, paper down, head
 * tracking you continuously for the whole loop, even across the
 * corridor. Moderate.
 */
export const commuterStare: AnomalyDef = {
  id: "commuter.stare",
  displayName: "He Watches You Work",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.upright"],
  testSeed: "test.commuter.stare",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const was = c.isPresent();
    c.root.setEnabled(true);
    const g = c.root;
    return {
      update() {
        const p = ctx.player.position;
        const gp = g.getAbsolutePosition();
        const yawTo = Math.atan2(p.x - gp.x, p.z - gp.z) - g.rotation.y;
        const wrap = Math.atan2(Math.sin(yawTo), Math.cos(yawTo));
        c.fig.headPivot.rotation.x = -0.05; // chin up, off the paper
        c.fig.headPivot.rotation.y = Math.max(-1.1, Math.min(1.1, wrap));
      },
      cleanup() {
        c.reset(was);
      },
    };
  },
};
