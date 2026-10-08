/**
 * doors.slam — on the commit walk the south leaves part like always —
 * then mid-part they crash shut in your face, hold a breath, and open
 * again as if nothing happened. Fires once, when you're close enough
 * to feel it. Unmistakable spatial-class anomaly.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const doorsSlam: AnomalyDef = {
  id: "doors.slam",
  displayName: "The Doors Slammed",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: ["door.south.inner.L", "door.south.inner.R"],
  excludes: [
    "door.stuck",
    "door.slow",
    "doors.open",
    "door.breathes",
    "figure.south",
    "sightline.impossible",
    "hall.stretch",
    "airlock.breach",
  ],
  testSeed: "test.doors.slam",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const rig = ctx.world.doors.southInner;
    // fires the moment the auto-open approach has the leaves parting —
    // they must be visibly moving when they crash shut
    const trigger01 = ctx.rng.range(0.15, 0.4);
    const slamAt = new Vector3(0, 1.4, 52.8);
    // t: -1 idle; 0..0.28 slam shut; ..1.5 held shut; then release once
    let t = -1;
    let done = false;
    return {
      update(dt) {
        if (t < 0) {
          if (!done && rig.open01 > trigger01) {
            t = 0;
            done = true;
            ctx.audio.playSlam(slamAt);
            ctx.player.jolt(0.55); // the crash lands in your chest
          }
          return;
        }
        t += dt;
        if (t < 0.28) {
          rig.target01 = 0;
          rig.open01 = Math.max(0, rig.open01 - dt * 4.5);
        } else if (t < 1.5) {
          rig.target01 = 0;
          rig.open01 = 0;
        } else {
          rig.target01 = 1; // hand back to the normal approach-open cycle
          t = -1;
        }
      },
      cleanup() {
        rig.target01 = 0;
        rig.open01 = 0;
      },
    };
  },
};
