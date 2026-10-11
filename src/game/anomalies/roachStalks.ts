import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * roach.stalks — it only moves while you're still. Stand anywhere
 * and it unhurriedly closes the distance along the wall base; the
 * moment you step, it freezes dead. You will catch it mid-creep once,
 * and never again.
 */
export const roachStalks: AnomalyDef = {
  id: "roach.stalks",
  displayName: "It Only Moves When You're Still",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["roach"],
  excludes: ["roach.gone", "roach.dead", "roach.huge", "roach.swarm", "roach.flees"],
  testSeed: "test.roach.stalks",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const r = ctx.world.registry.get("roach");
    const rest = r.position.clone();
    const restRot = r.rotation.y;
    const lastP = ctx.player.position.clone();
    let stillT = 0;
    return {
      update(dt) {
        const p = ctx.player.position;
        const moved = Vector3.Distance(p, lastP);
        lastP.copyFrom(p);
        if (moved > 0.004) {
          stillT = 0;
          r.rotation.y = -0.4; // dead still, angled like baseline
        } else {
          stillT += dt;
          if (stillT > 1.2) {
            // creep toward the player along the wall base
            const dir = p.z > r.position.z ? 1 : -1;
            r.position.z += dir * 0.35 * dt;
            r.rotation.y = dir > 0 ? 0 : Math.PI; // nose toward the target
          }
        }
      },
      cleanup() {
        r.position = rest;
        r.rotation.y = restRot;
      },
    };
  },
};
