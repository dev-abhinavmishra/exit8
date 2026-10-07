/**
 * machine.silence — the junction machine's hum only sounds while you're
 * looking at it. Face away and it is simply not running. Moderate — and
 * worse, it makes you doubt the baseline.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const machineSilence: AnomalyDef = {
  id: "machine.silence",
  displayName: "Shy Machinery",
  chapter: 3,
  category: "sound",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["junction.machine"],
  excludes: ["sound.machinery"],
  testSeed: "test.machine.silence",
  dangerous: false,
  activate(ctx) {
    let scale = 1;
    ctx.audio.setMachineGainScale(() => scale);
    const to = new Vector3();
    return {
      update(dt) {
        // observed = machine inside the central ~40° of view
        const fwd = ctx.player.camera.getDirection(Vector3.Forward());
        ctx.world.anchors.junctionMachine.subtractToRef(ctx.player.position, to);
        to.normalize();
        const seen = Vector3.Dot(fwd, to) > 0.75;
        const want = seen ? 1 : 0;
        scale += (want - scale) * Math.min(1, 5 * dt);
      },
      cleanup() {
        ctx.audio.setMachineGainScale(null);
      },
    };
  },
};
