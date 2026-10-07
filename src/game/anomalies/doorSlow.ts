/**
 * door.slow — the south inner doors still open for you, but they crawl:
 * fourteen seconds of servos where there used to be two. The gap widens
 * a centimetre a breath while you stand under the sign waiting.
 */
import type { AnomalyDef } from "./types";

const OPEN_S = 14;

export const doorSlow: AnomalyDef = {
  id: "door.slow",
  displayName: "Slow Doors",
  chapter: 1,
  category: "systemic",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["door.south.inner.L", "door.south.inner.R"],
  excludes: ["door.stuck", "figure.south", "sightline.impossible"],
  testSeed: "test.door.slow",
  dangerous: false,
  activate(ctx) {
    const rig = ctx.world.doors.southInner;
    let creep = 0;
    return {
      update(dt) {
        if (rig.target01 > 0.5) {
          creep = Math.min(1, creep + dt / OPEN_S);
          if (rig.open01 > creep) {
            rig.open01 = creep;
            // re-pin the leaves the rig already moved this frame
            rig.left.position.x = -0.6 - creep * 1.2 * 0.92;
            rig.right.position.x = 0.6 + creep * 1.2 * 0.92;
            rig.leftCollider.position.x = rig.left.position.x;
            rig.rightCollider.position.x = rig.right.position.x;
          }
        }
      },
      cleanup() {},
    };
  },
};
