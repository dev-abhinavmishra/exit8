/**
 * duct.mouth — the mid-duct grate is gone. Where the slatted register
 * sat over the corridor there's only the duct's open throat — a long
 * black mouth in the ceiling line, drawing the eye every time you pass
 * beneath. Subtle: a fixture missing, not added.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

const GRATE = "duct.grate.1"; // mid-corridor, z≈27

export const ductMouth: AnomalyDef = {
  id: "duct.mouth",
  displayName: "Open Duct",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [8, 100],
  requires: [GRATE],
  excludes: ["vent.loose"],
  testSeed: "test.duct.mouth",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const g = world.registry.mesh(GRATE);
    const gy = g.position.y;
    const gz = g.position.z;
    g.isVisible = false;
    const riders: AbstractMesh[] = [];
    for (let s = 0; s < 3; s++) {
      const sl = scene.getMeshByName(`duct.grate.1.slat.${s}`) as AbstractMesh | null;
      if (sl) {
        riders.push(sl);
        sl.isVisible = false;
      }
    }
    // the throat the grate covered — blacker than the ceiling shadow
    const holeMat = new StandardMaterial("anomaly.duct.hole.mat", scene);
    holeMat.diffuseColor = new Color3(0.004, 0.004, 0.005);
    holeMat.specularColor = new Color3(0, 0, 0);
    const hole = CreateBox("anomaly.duct.hole", { width: 0.28, height: 0.02, depth: 0.66 }, scene);
    hole.material = holeMat;
    hole.position.set(g.position.x, gy + 0.01, gz);
    return {
      update() {},
      cleanup() {
        hole.dispose();
        holeMat.dispose();
        g.isVisible = true;
        for (const sl of riders) sl.isVisible = true;
      },
    };
  },
};
