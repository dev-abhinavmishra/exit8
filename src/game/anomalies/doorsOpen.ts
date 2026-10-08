/**
 * doors.open — the south airlock doors stand already parted when you
 * arrive. The cycle ran without you. Nothing moves; the gap onto the
 * dark vestibule is simply there from the first step of the loop.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const doorsOpen: AnomalyDef = {
  id: "doors.open",
  displayName: "The Doors Already Open",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["door.south.inner.L", "door.south.inner.R"],
  excludes: [
    "door.stuck",
    "door.slow",
    "figure.south",
    "sightline.impossible",
    "hall.stretch",
    "airlock.breach",
  ],
  testSeed: "test.doors.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const rig = ctx.world.doors.southInner;
    // pre-set both ends of the rig's own easing so the leaves never
    // move — they just stand open on a dark vestibule all loop
    rig.target01 = 1;
    rig.open01 = 1;
    return {
      update() {
        rig.target01 = 1; // approach-auto-open also writes 1; hold it regardless
      },
      cleanup() {
        rig.target01 = 0;
        rig.open01 = 0;
      },
    };
  },
};
