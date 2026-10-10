/**
 * dryer.runs — the washroom's hand dryer kicks on as you step up to the
 * vanity: its LED wakes, the motor whines, and it keeps running a beat
 * too long after you would have moved your hands away. Moderate: a
 * proximity scare that plays the room's one appliance against you.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DRYER = new Vector3(3.7, 1.15, 16.6);

export const dryerRuns: AnomalyDef = {
  id: "dryer.runs",
  displayName: "The Dryer Runs By Itself",
  chapter: 1,
  category: "sound",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [8, 100],
  requires: ["wash.dryer", "wash.dryer.led"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.dryer.runs",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const led = world.registry.mesh("wash.dryer.led");
    const ledMat = led.material;
    let running = false;
    let cooldown = 0;
    return {
      update(dt) {
        cooldown -= dt;
        const inRoom = ctx.player.position.x > 1.9 && ctx.player.position.z > 16.4 && ctx.player.position.z < 20.1;
        const near = inRoom && Math.hypot(ctx.player.position.x - DRYER.x, ctx.player.position.z - DRYER.z) < 2.1;
        if (near && !running) {
          running = true;
          led.material = world.materials.trofferLit;
          ctx.audio.playRattle(DRYER);
          cooldown = 0.9;
        } else if (running && cooldown <= 0) {
          // the motor whine holds while you're close — a beat past
          // polite, then dies the moment you leave the wall
          ctx.audio.playWhistle(DRYER, 1150, 1.1);
          cooldown = 1.15;
        }
        if (running && !inRoom) {
          running = false;
          led.material = ledMat;
        }
      },
      cleanup() {
        led.material = ledMat;
      },
    };
  },
};
