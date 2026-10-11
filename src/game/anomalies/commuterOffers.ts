/**
 * commuter.offers — as the inspector crosses the bench the commuter
 * holds the paper OUT toward the lane, arm extended, offering it —
 * and keeps it out until the inspector is past. Moderate.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const commuterOffers: AnomalyDef = {
  id: "commuter.offers",
  displayName: "Offering the Paper",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["commuter", "commuter.paper"],
  excludes: ["commuter.ignores", "commuter.follows"],
  testSeed: "test.commuter.offers",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const c = ctx.world.commuter;
    const walker = ctx.world.ambientWalker;
    const was = c.isPresent();
    c.reset(true);
    c.setGreetEnabled(false);
    const arm = c.fig.arms[1]!;
    const paper = ctx.world.registry.mesh("commuter.paper");
    const savedPaperY = paper ? paper.position.y : 0;
    const savedPaperRx = paper ? paper.rotation.x : 0;
    return {
      update() {
        const near = Math.abs(walker.root.position.z - 33.3) < 2.6;
        const lift = near ? 1 : 0.25;
        arm.rotation.x = -0.7 - lift * 0.9;
        if (paper) {
          paper.position.y = savedPaperY + lift * 0.1;
          paper.rotation.x = savedPaperRx - lift * 0.35;
        }
      },
      cleanup() {
        arm.rotation.x = -0.7;
        if (paper) {
          paper.position.y = savedPaperY;
          paper.rotation.x = savedPaperRx;
        }
        c.setGreetEnabled(true);
        c.reset(was);
      },
    };
  },
};
