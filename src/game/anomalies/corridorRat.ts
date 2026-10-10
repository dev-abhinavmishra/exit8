import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.rat — a small dark shape darts east wall to west wall across
 * the walkway and under the platform gate. Reads as motion. Unmistakable.
 */
export const corridorRat: AnomalyDef = {
  id: "corridor.rat",
  displayName: "Something Crosses The Floor",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [25, 100],
  requires: ["platform.gate"],
  excludes: [],
  testSeed: "test.corridor.rat",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const fur = new StandardMaterial("mat.corridor.fur", ctx.scene);
    fur.diffuseColor = new Color3(0.06, 0.05, 0.04);
    fur.specularColor = Color3.Black();
    const rat = CreateBox("anomaly.corridor.rat", { width: 0.16, height: 0.09, depth: 0.07 }, ctx.scene);
    rat.material = fur;
    rat.parent = ctx.world.root;
    rat.position.set(1.6, 0.045, 38.9);
    const tail = CreateBox(
      "anomaly.corridor.rat.tail",
      { width: 0.14, height: 0.015, depth: 0.015 },
      ctx.scene,
    );
    tail.material = fur;
    tail.parent = ctx.world.root;
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        const cyc = t % 7.5;
        if (cyc < 1.1) {
          const k = cyc / 1.1;
          rat.position.x = 1.6 - k * 3.1;
          rat.position.z = 38.9 + Math.sin(k * 9) * 0.08;
          rat.rotation.y = -Math.PI / 2 + Math.sin(k * 9) * 0.1;
          tail.position.set(rat.position.x + 0.15, 0.02, rat.position.z + 0.04);
          tail.rotation.y = rat.rotation.y + Math.sin(t * 18) * 0.3;
          rat.isVisible = tail.isVisible = true;
        } else {
          rat.isVisible = tail.isVisible = false;
        }
      },
      cleanup() {
        rat.dispose();
        tail.dispose();
        fur.dispose();
      },
    };
  },
};
