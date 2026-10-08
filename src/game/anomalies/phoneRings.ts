/**
 * phone.rings — the dead internal handset rings by itself, a warbling
 * double-burst trill from the wall niche, its LINE lamp blinking red
 * in time. Nobody is calling this number. Moderate audio-class anomaly.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const phoneRings: AnomalyDef = {
  id: "phone.rings",
  displayName: "The Dead Phone Rings",
  chapter: 2,
  category: "sound",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["prop.phone"],
  excludes: ["phone.gone", "phone.lit", "phone.offhook"],
  testSeed: "test.phone.rings",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const phone = world.registry.get("prop.phone");
    const lamp = phone.getChildMeshes().find((m) => m.name === "prop.phone.lamp");
    const lampMat = new StandardMaterial("anomaly.phone.lampOn", scene);
    lampMat.diffuseColor = new Color3(0.75, 0.08, 0.06);
    lampMat.emissiveColor = new Color3(0.55, 0.05, 0.04);
    const lampOff = lamp?.material ?? null;
    const pos = phone.getAbsolutePosition().clone();

    const PERIOD = ctx.rng.range(3.9, 4.9);
    let t = -PERIOD * 0.4; // first ring lands shortly after the loop settles
    let lastPhase = 0;
    return {
      update(dt) {
        t += dt;
        const phase = ((t % PERIOD) + PERIOD) % PERIOD;
        if (phase < lastPhase) ctx.audio.playRing(pos);
        lastPhase = phase;
        if (lamp) lamp.material = phase < 1.15 ? lampMat : lampOff;
      },
      cleanup() {
        if (lamp) lamp.material = lampOff;
        lampMat.dispose();
      },
    };
  },
};
