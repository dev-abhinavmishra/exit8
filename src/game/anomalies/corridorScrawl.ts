import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.scrawl — a chalk scrawl laid across the walkway at z 44:
 * unreadable strokes, hurried hand. Chapter III / moderate.
 */
export const corridorScrawl: AnomalyDef = {
  id: "corridor.scrawl",
  displayName: "Written On The Floor",
  chapter: 3,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["svc.jbox.1"],
  excludes: ["corridor.tag"],
  testSeed: "test.corridor.scrawl",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const chalk = new StandardMaterial("mat.corridor.chalk", ctx.scene);
    chalk.diffuseColor = new Color3(0.85, 0.84, 0.78);
    chalk.specularColor = Color3.Black();
    const marks: ReturnType<typeof CreateBox>[] = [];
    for (let i = 0; i < 8; i++) {
      const len = 0.12 + (i % 4) * 0.09;
      const m = CreateBox(
        `anomaly.corridor.mark.${i}`,
        { width: 0.035, height: 0.006, depth: len },
        ctx.scene,
      );
      m.material = chalk;
      m.parent = ctx.world.root;
      m.position.set(-0.35 + (i % 4) * 0.24, 0.014, 43.7 + Math.floor(i / 4) * 0.3);
      m.rotation.y = ((i * 0.7) % 1.5) - 0.5;
      marks.push(m);
    }
    return {
      update() {},
      cleanup() {
        marks.forEach((m) => m.dispose());
        chalk.dispose();
      },
    };
  },
};
