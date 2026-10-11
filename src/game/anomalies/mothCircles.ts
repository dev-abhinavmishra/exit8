import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * moth.circles — it picked you tonight. The moth leaves its lamp and
 * orbits over YOUR head at wing height, circling wherever you stand.
 * The corridor has many wrongs; this one follows.
 */
export const mothCircles: AnomalyDef = {
  id: "moth.circles",
  displayName: "It Picked You",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["moth", "moth.body"],
  excludes: ["moth.gone", "moth.dead", "moth.huge", "moth.swarm", "moth.orbit"],
  testSeed: "test.moth.circles",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const moth = ctx.world.registry.get("moth");
    const rest = moth.position.clone();
    const restRot = moth.rotation.y;
    const wl = ctx.scene.getMeshByName("moth.wing.l");
    const wr = ctx.scene.getMeshByName("moth.wing.r");
    const wl0 = wl?.rotation.z ?? 0;
    const wr0 = wr?.rotation.z ?? 0;
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const p = ctx.player.position;
        const a = t * 1.6;
        moth.position = new Vector3(
          p.x + Math.cos(a) * 0.42,
          Math.min(p.y + 2.55, 2.93),
          p.z + Math.sin(a) * 0.42,
        );
        moth.rotation.y = -a - Math.PI / 2;
        const flap = Math.sin(t * 62) * 0.5;
        if (wl) wl.rotation.z = -0.2 - Math.abs(flap);
        if (wr) wr.rotation.z = 0.2 + Math.abs(flap);
      },
      cleanup() {
        moth.position = rest;
        moth.rotation.y = restRot;
        if (wl) wl.rotation.z = wl0;
        if (wr) wr.rotation.z = wr0;
      },
    };
  },
};
