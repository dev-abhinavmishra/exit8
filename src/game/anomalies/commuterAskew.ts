/**
 * commuter.askew — he reads crooked. The commuter's head sits cocked
 * toward his shoulder at an angle a neck should not hold for a whole
 * pass, and it never corrects — not for a page turn, not for you. The
 * pose lock hands every baseline write to this anomaly so the tilt
 * stays put.
 */
import type { AnomalyDef } from "./types";

export const commuterAskew: AnomalyDef = {
  id: "commuter.askew",
  displayName: "He Reads Crooked",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["commuter"],
  excludes: [
    "commuter.startle",
    "commuter.deadsleep",
    "commuter.doze.breath",
    "commuter.doze.stands",
    "commuter.doze.talks",
    "commuter.doze.mid",
    "commuter.fled",
    "commuter.benchpair",
    "commuter.follows",
  ],
  testSeed: "test.commuter.askew",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDozePoseLock(true);
    return {
      update() {
        const head = commuter.fig.headPivot;
        head.rotation.z = 0.42;
        head.rotation.x = 0.52;
        head.rotation.y = 0.1;
        // the paper tilts with him — he reads it like this, all night
        const arms = commuter.fig.arms;
        arms[0]!.rotation.x = -0.62;
        arms[1]!.rotation.x = -0.7;
      },
      cleanup() {
        commuter.setDozePoseLock(false);
      },
    };
  },
};
