/**
 * machine.dead — the status lamp on the junction machine by the lift
 * lobby is out. The machine itself still hums; the lamp you use to
 * clock it is dark. Subtle object-class anomaly.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef } from "./types";

export const machineDead: AnomalyDef = {
  id: "machine.dead",
  displayName: "Machine Lamp Out",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: ["junction.machine.lamp"],
  excludes: ["lift.arrives", "machine.silence", "machine.rattle"],
  testSeed: "test.machine.dead",
  dangerous: false,
  activate(ctx) {
    const { scene } = ctx;
    const lamp = ctx.world.registry.mesh("junction.machine.lamp");
    const orig = lamp.material;
    // swap in an unlit look — the lamp mesh shares mats.trofferLit with
    // every troffer, so we can't mutate the material itself
    const dead = new StandardMaterial("anomaly.machineDead", scene);
    dead.diffuseColor = new Color3(0.16, 0.15, 0.13);
    dead.specularColor = new Color3(0.04, 0.04, 0.04);
    lamp.material = dead;
    return {
      update() {},
      cleanup() {
        lamp.material = orig;
        dead.dispose();
      },
    };
  },
};
