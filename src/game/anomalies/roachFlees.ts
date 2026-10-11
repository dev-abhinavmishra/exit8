import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * roach.flees — it runs ahead of you the whole pass. Close within
 * three metres and it skitters four metres further up the wall base
 * in a burst — never toward you, never caught. The corridor is long
 * enough for this to go on a while.
 */
export const roachFlees: AnomalyDef = {
  id: "roach.flees",
  displayName: "It Runs Ahead",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [12, 100],
  requires: ["roach"],
  excludes: ["roach.gone", "roach.dead", "roach.huge", "roach.swarm"],
  testSeed: "test.roach.flees",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const r = ctx.world.registry.get("roach");
    const rest = r.position.clone();
    const restRot = r.rotation.y;
    let dartT = -1; // -1 = at rest
    let from = r.position.clone();
    let to = r.position.clone();
    return {
      update(dt) {
        const p = ctx.player.position;
        const dist = Math.abs(p.z - r.position.z) + Math.abs(p.x - r.position.x) * 0.5;
        if (dartT < 0 && dist < 3.2 && p.z < r.position.z + 1.0) {
          // player closing from behind — burst ahead along the wall
          from = r.position.clone();
          to = new Vector3(-1.52, 0.006, Math.min(r.position.z + 4.0, 52.0));
          dartT = 0;
        } else if (dartT >= 0) {
          dartT += dt;
          const k = Math.min(1, dartT / 0.45);
          r.position = Vector3.Lerp(from, to, k * k);
          r.rotation.y = Math.sin(dartT * 60) * 0.3; // skitter wobble
          if (k >= 1) {
            dartT = -1;
            r.rotation.y = -0.4;
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
