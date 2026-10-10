import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.sweep — a swept crescent of dust + paper scraps against the
 * west wall at z 20, crossed by one wet mop streak: someone cleaned
 * half the pass and stopped. Subtle primary + floor tell. Moderate.
 */
export const corridorSweep: AnomalyDef = {
  id: "corridor.sweep",
  displayName: "Half-Swept Floor",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["wall.left.0"],
  excludes: [],
  testSeed: "test.corridor.sweep",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const bits = new StandardMaterial("mat.sweep.bits", ctx.scene);
    bits.diffuseColor = new Color3(0.16, 0.14, 0.11);
    bits.specularColor = Color3.Black();
    const wet = new StandardMaterial("mat.sweep.wet", ctx.scene);
    wet.diffuseColor = new Color3(0.1, 0.11, 0.12);
    wet.specularColor = new Color3(0.5, 0.5, 0.5);
    wet.specularPower = 24;
    const made: { dispose(): void }[] = [];
    // debris crescent — small scraps along an arc hugging the wall base
    for (let i = 0; i < 10; i++) {
      const a = -0.8 + i * 0.18;
      const m = CreateBox(
        `anomaly.sweep.bit.${i}`,
        { width: 0.05 + (i % 3) * 0.02, height: 0.008, depth: 0.04 },
        ctx.scene,
      );
      m.material = bits;
      m.parent = ctx.world.root;
      m.position.set(-1.35 + Math.cos(a) * 0.45, 0.012, 20 + Math.sin(a) * 0.7);
      m.rotation.y = a * 2.1;
      made.push(m);
    }
    // the mop streak — one glossy darker pass crossing the crescent
    const streak = CreateBox("anomaly.sweep.streak", { width: 0.5, height: 0.004, depth: 2.2 }, ctx.scene);
    streak.material = wet;
    streak.parent = ctx.world.root;
    streak.position.set(-1.05, 0.011, 20.1);
    streak.rotation.y = 0.35;
    made.push(streak);
    return {
      update() {},
      cleanup() {
        made.forEach((m) => m.dispose());
        bits.dispose();
        wet.dispose();
      },
    };
  },
};
