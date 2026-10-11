/**
 * commuter.follows — when the inspector crosses the bench the commuter
 * is ON HIS FEET at the bench edge, head turning to keep him in frame
 * the whole pass. He never stands when the inspector is near — until
 * tonight. Moderate.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterFollows: AnomalyDef = {
  id: "commuter.follows",
  displayName: "Watching the Inspector Pass",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["commuter"],
  excludes: ["commuter.ignores", "commuter.offers", "commuter.upright", "commuter.stare"],
  testSeed: "test.commuter.follows",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const walker = ctx.world.ambientWalker;
    const was = c.isPresent();
    c.reset(true);
    c.setGreetEnabled(false);
    const g = c.root;
    g.position.set(-0.95, 0, 33.3);
    g.rotation.set(0, -Math.PI / 2 + 0.1, 0); // faces the walker's lane
    const head = c.fig.headPivot;
    return {
      update() {
        // keep his head on the inspector as long as he is in the stretch
        const dz = walker.root.position.z - g.position.z;
        const dx = walker.root.position.x - g.position.x;
        if (Math.abs(dz) < 9) {
          head.rotation.y = Math.atan2(dx, dz) - g.rotation.y;
          head.rotation.x = 0.12;
        }
      },
      cleanup() {
        head.rotation.y = 0;
        c.setGreetEnabled(true);
        c.reset(was);
      },
    };
  },
};
