/**
 * door.stuck — when the south inner doors part for your approach, only
 * the left leaf travels. The right leaf never moved; you file the
 * judgment through a half-width gap. The leaf stays dead to the motor
 * the whole loop.
 */
import type { AnomalyDef } from "./types";

export const doorStuck: AnomalyDef = {
  id: "door.stuck",
  displayName: "Dead Leaf",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["door.south.inner.R", "door.south.inner.L"],
  excludes: ["figure.south", "sightline.impossible"],
  testSeed: "test.door.stuck",
  dangerous: false,
  activate(ctx) {
    const rig = ctx.world.doors.southInner;
    // closed right-leaf centre per the rig's own slide formula (open01=0)
    const CLOSED_X = 1.2 / 2;
    return {
      update() {
        rig.right.position.x = CLOSED_X;
        rig.rightCollider.position.x = CLOSED_X;
      },
      cleanup() {},
    };
  },
};
