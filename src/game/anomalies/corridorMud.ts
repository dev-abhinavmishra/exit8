import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.mud — a trail of muddy boot prints cuts across the walkway
 * from the platform gate to the east wall and stops. Chapter II+ /
 * moderate.
 */
export const corridorMud: AnomalyDef = {
  id: "corridor.mud",
  displayName: "A Muddy Trail",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["platform.gate"],
  excludes: [],
  testSeed: "test.corridor.mud",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const mud = new StandardMaterial("mat.corridor.mud", ctx.scene);
    mud.diffuseColor = new Color3(0.12, 0.09, 0.06);
    mud.specularColor = new Color3(0.08, 0.06, 0.04);
    const prints: ReturnType<typeof CreateBox>[] = [];
    for (let i = 0; i < 9; i++) {
      const side = i % 2 === 0 ? -0.06 : 0.06;
      const m = CreateBox(
        `anomaly.corridor.print.${i}`,
        { width: 0.09, height: 0.005, depth: 0.26 },
        ctx.scene,
      );
      m.material = mud;
      m.parent = ctx.world.root;
      m.position.set(-1.4 + i * 0.33, 0.013, 39.4 + side - i * 0.02);
      m.rotation.y = Math.PI / 2 + (i % 3) * 0.12 - 0.1;
      prints.push(m);
    }
    return {
      update() {},
      cleanup() {
        prints.forEach((m) => m.dispose());
        mud.dispose();
      },
    };
  },
};
