/**
 * walker.notes — linger and the inspector notices you noticing. Stand
 * still ~6 s and he stops mid-route, clipboard up, head bent over the
 * page, pen working — writing you into his report. He goes back to his
 * patrol after a few seconds. Moderate: you have to be standing to
 * ever see it.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

const STILL_S = 6;
const WRITE_S = 4.2;

export const walkerNotes: AnomalyDef = {
  id: "walker.notes",
  displayName: "Wrote You Up",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [6, 100],
  requires: [],
  excludes: ["walker.absent", "walker.charge", "walker.stare", "walker.crawl", "walker.midstep"],
  testSeed: "test.walker.notes",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const walker = ctx.world.ambientWalker;
    let still = 0;
    let writing = -1;
    let lastX = ctx.player.position.x;
    let lastZ = ctx.player.position.z;
    return {
      update(dt) {
        const p = ctx.player.position;
        const moved = Math.abs(p.x - lastX) + Math.abs(p.z - lastZ) > 0.06;
        lastX = p.x;
        lastZ = p.z;
        if (writing >= 0) {
          writing += dt;
          if (writing > WRITE_S) {
            walker.setMode("normal");
            writing = -1;
          }
          return;
        }
        still = moved ? 0 : still + dt;
        if (still > STILL_S) {
          still = -999; // once per loop
          writing = 0;
          walker.setMode("notes");
          ctx.audio.caption("he is writing", null);
        }
      },
      cleanup() {
        walker.setMode("normal");
      },
    };
  },
};
