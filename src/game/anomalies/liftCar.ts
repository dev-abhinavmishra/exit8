/**
 * lift.car — the dead service lift came back. The leaves stand parted
 * onto a LIT car that has no business waiting in a sealed shaft: pale
 * cab walls, a glowing light strip, a handrail at hip height — all of
 * it parked inside a throat the game insists is empty. Moderate: the
 * warm spill reads across the junction.
 */
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DOOR_Z = 49.5;
// shaft interior x-span (concourse.ts: lback 2.35 → sback 2.85)
const SHAFT_X = 2.35;
const SHAFT_BACK = 2.85;

export const liftCar: AnomalyDef = {
  id: "lift.car",
  displayName: "The Car Is Waiting",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [14, 100],
  requires: ["lift.door.-1", "lift.door.1", "lift.panel.lamp"],
  excludes: ["lift.arrives"],
  testSeed: "test.lift.car",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const lamp = world.registry.mesh("lift.panel.lamp");
    const leaves = [world.registry.mesh("lift.door.-1"), world.registry.mesh("lift.door.1")];
    const home = leaves.map((l) => l.position.z);
    const open = rng.range(0.3, 0.42); // a narrower gap than lift.arrives

    lamp.material = world.materials.trofferLit;
    leaves.forEach((l, i) => {
      l.position.z = home[i]! + (i === 0 ? -open : open);
    });

    // the cab — pale walls, lit strip, hip rail — parked in the shaft
    const cabMat = new StandardMaterial("anomaly.lift.car.mat", scene);
    cabMat.disableLighting = true; // a powered cab interior — reads lit regardless
    cabMat.diffuseColor = new Color3(0, 0, 0);
    cabMat.emissiveColor = new Color3(0.95, 0.85, 0.58);
    const litMat = new StandardMaterial("anomaly.lift.car.lit", scene);
    litMat.disableLighting = true;
    litMat.diffuseColor = new Color3(0, 0, 0);
    litMat.emissiveColor = new Color3(0.95, 0.85, 0.58);
    const railMat = new StandardMaterial("anomaly.lift.car.rail", scene);
    railMat.disableLighting = true;
    railMat.diffuseColor = new Color3(0, 0, 0);
    railMat.emissiveColor = new Color3(0.36, 0.31, 0.22);

    const parts: AbstractMesh[] = [];
    const mk = (
      name: string,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      m: StandardMaterial,
    ) => {
      const b = CreateBox(name, { width: w, height: h, depth: d }, scene);
      b.material = m;
      b.position = new Vector3(x, y, z);
      parts.push(b);
      return b;
    };
    // cab back + side walls — parked just inside the lift.reveal void
    // plate (x≈2.73): everything reads through it, nothing behind it
    mk("anomaly.lift.car.back", 0.04, 2.35, 1.58, SHAFT_BACK - 0.15, 1.2, DOOR_Z, cabMat);
    mk("anomaly.lift.car.side.n", 0.3, 2.35, 0.04, SHAFT_X + 0.2, 1.2, DOOR_Z - 0.75, cabMat);
    mk("anomaly.lift.car.side.s", 0.3, 2.35, 0.04, SHAFT_X + 0.2, 1.2, DOOR_Z + 0.75, cabMat);
    // lit ceiling strip + a warm floor-edge strip — the cab glow
    mk("anomaly.lift.car.strip", 0.3, 0.05, 1.1, SHAFT_X + 0.21, 2.34, DOOR_Z, litMat);
    mk("anomaly.lift.car.floor", 0.28, 0.04, 1.5, SHAFT_X + 0.2, 0.04, DOOR_Z, litMat);
    // handrail across the cab at hip height
    mk("anomaly.lift.car.rail", 0.03, 0.03, 1.4, SHAFT_BACK - 0.19, 0.95, DOOR_Z, railMat);
    // the cab's own closed doors: a centre seam + scuffed kick band so the
    // lit interior reads as a car, not a light card
    const seamMat = new StandardMaterial("anomaly.lift.car.seam", scene);
    seamMat.disableLighting = true;
    seamMat.diffuseColor = new Color3(0, 0, 0);
    seamMat.emissiveColor = new Color3(0.16, 0.13, 0.09);
    mk("anomaly.lift.car.doorseam", 0.015, 2.35, 0.02, SHAFT_BACK - 0.185, 1.2, DOOR_Z, seamMat);
    mk("anomaly.lift.car.kick", 0.015, 0.16, 1.5, SHAFT_BACK - 0.185, 0.1, DOOR_Z, seamMat);

    // warm interior spill through the gap
    const glow = new PointLight("anomaly.lift.car.glow", new Vector3(SHAFT_X + 0.22, 1.9, DOOR_Z), scene);
    glow.intensity = 3.2;
    glow.diffuse = new Color3(1.0, 0.88, 0.64);
    glow.range = 4.5;

    ctx.audio.playChime(new Vector3(2.1, 1.7, DOOR_Z));

    // the trap: step inside the cab and the leaves take you back — the
    // doors shut behind you, the car light gutters, and it holds you a
    // few seconds before letting go. Dread, not damage.
    let trapped = false;
    let tt = 0;
    return {
      update(dt) {
        if (!trapped) {
          const p = ctx.player.position;
          if (p.x > 2.32 && Math.abs(p.z - DOOR_Z) < 0.55) {
            trapped = true;
            ctx.player.jolt(0.55);
            ctx.audio.playDoorSlide(new Vector3(2.1, 1.4, DOOR_Z), false);
            ctx.audio.caption("the car is not a way out", new Vector3(2.1, 1.4, DOOR_Z));
          }
          return;
        }
        tt += dt;
        const close = Math.min(1, tt / 0.9); // leaves return home over 0.9s
        const reo = Math.max(0, Math.min(1, (tt - 6.6) / 0.9)); // release after the hold
        const k = reo > 0 ? reo : 1 - close;
        leaves.forEach((l, i) => {
          l.position.z = home[i]! + (i === 0 ? -open : open) * k;
        });
        // the cab light gutters while it's got you
        glow.intensity =
          tt > 1 && tt < 6.4 ? 1.0 + Math.abs(Math.sin(tt * 11) * Math.sin(tt * 23)) * 1.9 : 3.2;
        if (tt > 1 && tt < 1.05) ctx.audio.playGroan(new Vector3(2.4, 1.6, DOOR_Z));
      },
      cleanup() {
        lamp.material = world.materials.trofferDim;
        leaves.forEach((l, i) => {
          l.position.z = home[i]!;
        });
        parts.forEach((m) => m.dispose());
        glow.dispose();
      },
    };
  },
};
