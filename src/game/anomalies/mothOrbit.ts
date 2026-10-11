import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * moth.orbit — the moth isn't resting tonight: it flies. A loose
 * wobbling circuit under its own lamp, wings beating the whole loop —
 * a moving thing where a still one sat. Moderate: motion pulls the
 * eye up; the lamp it left behind is bare.
 */
export const mothOrbit: AnomalyDef = {
  id: "moth.orbit",
  displayName: "It's Flying Tonight",
  chapter: 1,
  category: "character",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["moth", "moth.body"],
  excludes: ["moth.gone", "moth.dead", "moth.huge", "moth.swarm"],
  testSeed: "test.moth.orbit",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const moth = ctx.scene.getTransformNodeByName("moth");
    if (!moth) return { update() {}, cleanup() {} };
    const wl = ctx.scene.getMeshByName("moth.wing.l");
    const wr = ctx.scene.getMeshByName("moth.wing.r");
    const cx = -0.9;
    const cz = 24.5;
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const a = t * 1.35; // ~4.6s a lap — lazy, not panicked
        moth.position = new Vector3(
          cx + Math.cos(a) * 0.55,
          2.62 + Math.sin(t * 2.9) * 0.16,
          cz + Math.sin(a) * 0.55,
        );
        moth.rotation.y = -a - Math.PI / 2 + Math.sin(t * 3.1) * 0.25; // tangent + wander
        // beat: wings flap ~11 Hz while flying
        const flap = Math.sin(t * 70) * 0.55;
        if (wl) wl.rotation.z = -0.2 - Math.abs(flap);
        if (wr) wr.rotation.z = 0.2 + Math.abs(flap);
      },
      cleanup() {
        moth.position = new Vector3(-0.9, 2.935, 24.5);
        moth.rotation.y = 0;
        if (wl) wl.rotation.z = -0.16;
        if (wr) wr.rotation.z = 0.16;
      },
    };
  },
};
