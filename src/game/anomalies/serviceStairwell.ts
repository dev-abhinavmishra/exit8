/**
 * service.stairwell — the corridor's service door stands wide open on a
 * lit concrete stairwell descending east — a throat that cannot exist
 * behind a 0.12 m wall. Get within a few metres and the door slams
 * itself shut; the stair is gone. Unmistakable: the impossible room is
 * right there, then it isn't.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DOOR = new Vector3(1.68, 1.2, 15.5);
const HALF = 0.44;
const OPEN_TH = 1.25;
const SLAM_D2 = 4.2 * 4.2;
const SLAM_S = 0.42;

export const serviceStairwell: AnomalyDef = {
  id: "service.stairwell",
  displayName: "The Service Stair",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [30, 100],
  requires: ["service.door.leaf"],
  excludes: ["door.ajar", "door.breathes", "door.lit", "door.rattle", "door.service", "depth.mismatch"],
  testSeed: "test.service.stairwell",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const leaf = world.registry.mesh("service.door.leaf");
    const slit = world.registry.mesh("service.door.slit");
    const x0 = leaf.position.x;
    const z0 = leaf.position.z;
    // leaf swung fully inward against the throat's north wall — the
    // doorway is a clean opening onto the lit landing
    const openX = x0 + HALF * Math.sin(OPEN_TH);
    const openZ = z0 - HALF + HALF * Math.cos(OPEN_TH);
    leaf.rotation.y = OPEN_TH;
    leaf.position.x = openX;
    leaf.position.z = openZ;
    slit.isVisible = false;
    world.serviceStair.setEnabled(true);
    world.serviceStairLamp.intensity = 0.85;

    let slammed = false;
    let done = false;
    let tt = 0;
    return {
      update(dt) {
        if (done) return;
        if (!slammed) {
          const p = ctx.player.position;
          const dx = p.x - DOOR.x;
          const dz = p.z - DOOR.z;
          if (dx * dx + dz * dz < SLAM_D2) {
            slammed = true;
            tt = 0;
          }
          return;
        }
        tt += dt;
        const k = Math.min(1, tt / SLAM_S);
        const e = 1 - k * k; // accelerating shut — the door picks up speed
        leaf.rotation.y = OPEN_TH * e;
        leaf.position.x = x0 + HALF * Math.sin(leaf.rotation.y);
        leaf.position.z = z0 - HALF + HALF * Math.cos(leaf.rotation.y);
        if (k >= 1) {
          leaf.rotation.y = 0;
          leaf.position.x = x0;
          leaf.position.z = z0;
          slit.isVisible = true;
          world.serviceStair.setEnabled(false);
          world.serviceStairLamp.intensity = 0;
          ctx.audio.playSlam(DOOR);
          ctx.player.jolt(0.5);
          ctx.audio.caption("it was open a moment ago", DOOR);
          done = true;
        }
      },
      cleanup() {
        leaf.rotation.y = 0;
        leaf.position.x = x0;
        leaf.position.z = z0;
        slit.isVisible = true;
        world.serviceStair.setEnabled(false);
        world.serviceStairLamp.intensity = 0;
      },
    };
  },
};
