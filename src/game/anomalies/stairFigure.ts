/**
 * stair.figure — the service door stands open on the lit stairwell
 * again, but this time someone is down there: a dark figure at the
 * mid-landing, squared up the flight toward you. Stand back and it
 * shut on its threshold, never yours. Unmistakable, worse than empty.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DOOR = new Vector3(1.68, 1.2, 15.5);
const HALF = 0.44;
const OPEN_TH = 1.25;
const SLAM_D2 = 2.6 * 2.6;
const SLAM_S = 0.42;
// nearer you stand, the faster it comes
const STEP_X = 0.24;
const STEP_Y = 0.185;

export const stairFigure: AnomalyDef = {
  id: "stair.figure",
  displayName: "Someone on the Service Stair",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.55,
  progressionRange: [40, 100],
  requires: ["service.door.leaf"],
  excludes: [
    "service.stairwell",
    "door.ajar",
    "door.breathes",
    "door.lit",
    "door.rattle",
    "door.service",
    "depth.mismatch",
    "corridor.mirror",
    "corridor.long",
    "corridor.narrow",
    "corridor.breathes",
    "figure.rush",
    "gauntlet.watch",
  ],
  testSeed: "test.stair.figure",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const leaf = world.registry.mesh("service.door.leaf");
    const slit = world.registry.mesh("service.door.slit");
    const x0 = leaf.position.x;
    const z0 = leaf.position.z;
    leaf.rotation.y = OPEN_TH;
    leaf.position.x = x0 + HALF * Math.sin(OPEN_TH);
    leaf.position.z = z0 - HALF + HALF * Math.cos(OPEN_TH);
    slit.isVisible = false;
    world.serviceStair.setEnabled(true);
    world.serviceStairLamp.intensity = 0.85;

    // mid-flight, squared up the stairs toward the doorway
    const fig = buildFigure(scene, world.root, "anomaly.stair.fig", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const figX0 = 3.6;
    const figY0 = -1.1;
    fig.root.position.set(figX0, figY0, 15.5);
    fig.root.rotation.y = -Math.PI / 2;
    let steps = 0;
    let stepAcc = 0;
    let caption = false;
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
          const d2 = dx * dx + dz * dz;
          if (!caption && d2 < 8 * 8) {
            caption = true;
            ctx.audio.caption("someone is on the service stair", DOOR);
          }
          // 3m it hurries — the figure's step rate scales with 1/d
          const d = Math.sqrt(d2);
          if (d < 5.5 && steps < 8) {
            stepAcc += dt * (1.4 + (5.5 - d));
            if (stepAcc > 1) {
              stepAcc = 0;
              steps++;
            }
          }
          // ease toward the current tread
          const tx = figX0 - steps * STEP_X;
          const ty = figY0 + steps * STEP_Y;
          fig.root.position.x += (tx - fig.root.position.x) * Math.min(1, dt * 4);
          fig.root.position.y += (ty - fig.root.position.y) * Math.min(1, dt * 4);
          if (d2 < SLAM_D2 || steps >= 8) {
            slammed = true;
            tt = 0;
          }
          return;
        }
        tt += dt;
        const k = Math.min(1, tt / SLAM_S);
        const e = 1 - k * k;
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
          fig.root.setEnabled(false);
          ctx.audio.playSlam(DOOR);
          ctx.player.jolt(0.5);
          ctx.audio.caption("it never reached the top", DOOR);
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
        fig.root.dispose(false, true);
      },
    };
  },
};
