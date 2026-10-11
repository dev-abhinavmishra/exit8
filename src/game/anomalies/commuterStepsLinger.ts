import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * commuter.steps.linger — he leaves through the south door as always,
 * the leaf seals behind him — and his footsteps keep going for four
 * more strides on the other side, fading under the cap.
 */
export const commuterStepsLinger: AnomalyDef = {
  id: "commuter.steps.linger",
  displayName: "Steps Past The Door",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [20, 85],
  requires: ["commuter", "al.south.cap"],
  excludes: [
    "commuter.stays",
    "commuter.returns",
    "commuter.north",
    "commuter.fled",
    "commuter.midflee",
    "commuter.steps.ahead",
    "commuter.steps.off",
  ],
  testSeed: "test.commuter.steps.linger",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 14 });
    // four steps under the sealed cap, spaced like his walk, fading —
    // ordinary timbre (anomalous=false): the wrongness is that they
    // exist at all, not how they sound
    const beats = [
      { t: 0.3, z: 56.9, i: 0.4 },
      { t: 0.88, z: 57.6, i: 0.34 },
      { t: 1.46, z: 58.3, i: 0.28 },
      { t: 2.04, z: 59.0, i: 0.22 },
    ];
    let queued = false;
    let lingerT = 0;
    let bi = 0;
    return {
      update(dt: number) {
        if (!queued && commuter.departState() === "gone") {
          queued = true;
          lingerT = 0;
        }
        if (!queued || bi >= beats.length) return;
        lingerT += dt;
        while (bi < beats.length && lingerT >= beats[bi]!.t) {
          const b = beats[bi]!;
          ctx.audio.playFootstep(new Vector3(-0.55, 0, b.z), b.i);
          bi += 1;
        }
      },
      cleanup() {},
    };
  },
};
