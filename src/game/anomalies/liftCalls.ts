/**
 * lift.calls — the dead service lift is being called. Its lamp burns
 * steady, a soft chime answers every twenty seconds or so, and the
 * leaves stay shut. Whatever is riding it never reaches this floor.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const CHIME_EVERY = 19;

export const liftCalls: AnomalyDef = {
  id: "lift.calls",
  displayName: "Lift Being Called",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: ["lift.panel.lamp", "lift.door.-1", "lift.door.1"],
  excludes: ["lift.arrives"],
  testSeed: "test.lift.calls",
  dangerous: false,
  activate(ctx) {
    const lamp = ctx.world.registry.mesh("lift.panel.lamp");
    const home = lamp.material;
    lamp.material = ctx.world.materials.trofferLit;
    let t = 4; // first chime comes early so the cue lands
    const pos = new Vector3(2.1, 1.7, 49.5);
    return {
      update(dt) {
        t += dt;
        if (t >= CHIME_EVERY) {
          t = 0;
          ctx.audio.playChime(pos);
        }
      },
      cleanup() {
        lamp.material = home;
      },
    };
  },
};
