/**
 * hatch.knocks — something knocks behind the always-shut service
 * hatch. Every few seconds while you're near it, a soft double knock
 * comes through the panel and the hatch plate gives a barely-visible
 * shudder. You don't see anything; the panel just answers to nobody.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const hatchKnocks: AnomalyDef = {
  id: "hatch.knocks",
  displayName: "Knocking Behind the Panel",
  chapter: 3,
  category: "sound",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["hatch.plate"],
  excludes: ["hatch.open", "gallery", "door.ajar"],
  testSeed: "test.hatch.knocks",
  dangerous: false,
  activate(ctx) {
    const { world, rng } = ctx;
    const plate = world.registry.mesh("hatch.plate");
    const src = new Vector3(1.6, plate.position.y, plate.position.z);
    const plateX = plate.position.x;
    // knock pairs on a slow cadence; the plate shudders with each
    let wait = rng.range(1.2, 2.8);
    let second = -1; // time till the answering knock
    let rattle = -1; // plate shudder timer
    return {
      update(dt) {
        if (rattle >= 0) {
          rattle += dt;
          // a 6 px shudder envelope that dies in ~0.18s
          plate.position.x = plateX + Math.sin(rattle * 90) * 0.004 * Math.max(0, 1 - rattle / 0.18);
          if (rattle >= 0.18) {
            rattle = -1;
            plate.position.x = plateX;
          }
        }
        if (second >= 0) {
          second -= dt;
          if (second <= 0) {
            second = -1;
            ctx.audio.playKnock(src);
            rattle = 0;
          }
          return;
        }
        wait -= dt;
        if (wait <= 0) {
          // only knock when the player is near enough to hear —
          // the scare never spends itself on an empty corridor
          const near = Math.abs(ctx.player.position.z - src.z) < 15;
          if (near) {
            ctx.audio.playKnock(src);
            rattle = 0;
            second = 0.32; // knock-knock
          }
          wait = rng.range(3.5, 7.5);
        }
      },
      cleanup() {
        plate.position.x = plateX;
      },
    };
  },
};
