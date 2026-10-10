import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * platform.train — a lit carriage sweeps through the void behind the
 * bars, window-bright, two passes and gone. Unmistakable.
 */
export const platformTrain: AnomalyDef = {
  id: "platform.train",
  displayName: "A Train Goes By",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["platform.void", "platform.signal"],
  excludes: ["platform.figure"],
  testSeed: "test.platform.train",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const gate = ctx.world.registry.get("platform.gate");
    const streak = new StandardMaterial("mat.platform.trainlit", ctx.scene);
    streak.diffuseColor = new Color3(0.9, 0.85, 0.7);
    streak.emissiveColor = new Color3(0.85, 0.78, 0.55);
    const lit = CreateBox("anomaly.platform.trainlit", { width: 0.02, height: 1.7, depth: 0.9 }, ctx.scene);
    lit.material = streak;
    lit.parent = gate;
    lit.position.set(-1.93, 1.3, 39.1);
    let t = 0;
    let heard = false;
    return {
      update(_dt: number) {
        t += _dt;
        const cyc = t % 4.2;
        lit.position.z = cyc < 1.4 ? 38.95 + cyc * 0.62 : -10;
        if (!heard && t > 0.5) {
          heard = true;
          ctx.audio.caption("a train goes by — without stopping", null);
        }
      },
      cleanup() {
        lit.dispose();
        streak.dispose();
      },
    };
  },
};
