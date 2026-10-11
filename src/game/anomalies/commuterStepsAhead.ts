import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * commuter.steps.ahead — his departure walk sounds displaced: every
 * footfall lands ~3.5 m ahead of his body, along the route he's
 * walking. Watch him and the steps; they refuse to line up.
 */
export const commuterStepsAhead: AnomalyDef = {
  id: "commuter.steps.ahead",
  displayName: "Steps Ahead Of Him",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [25, 90],
  requires: ["commuter", "al.south.cap"],
  excludes: [
    "commuter.stays",
    "commuter.returns",
    "commuter.north",
    "commuter.fled",
    "commuter.midflee",
    "commuter.steps.linger",
    "commuter.steps.off",
  ],
  testSeed: "test.commuter.steps.ahead",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 16 });
    const prev = commuter.onStep;
    commuter.onStep = (pos) => {
      // the sound runs down the corridor ahead of him — normal timbre,
      // wrong place
      ctx.audio.playFootstep(new Vector3(pos.x, pos.y, pos.z + 3.5), 0.45);
    };
    return {
      update() {},
      cleanup() {
        commuter.onStep = prev;
      },
    };
  },
};
