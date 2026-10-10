import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * platform.figure — someone stands in the dark behind the bars: a
 * pale face at gate height, a body the light doesn't reach. Despawns
 * if you close on it. Unmistakable / character.
 */
export const platformFigure: AnomalyDef = {
  id: "platform.figure",
  displayName: "Someone In The Gap",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [35, 100],
  requires: ["platform.void"],
  excludes: ["platform.train"],
  testSeed: "test.platform.figure",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, player } = ctx;
    const gate = world.registry.get("platform.gate");
    const skin = new StandardMaterial("mat.platform.skin", scene);
    skin.diffuseColor = new Color3(0.75, 0.72, 0.66);
    skin.emissiveColor = new Color3(0.34, 0.32, 0.28);
    const cloth = new StandardMaterial("mat.platform.cloth", scene);
    cloth.diffuseColor = new Color3(0.04, 0.04, 0.05);
    const body = CreateBox("anomaly.platform.fig.body", { width: 0.02, height: 1.1, depth: 0.4 }, scene);
    body.material = cloth;
    body.parent = gate;
    body.position.set(-1.73, 0.85, 39.55);
    const face = CreateSphere("anomaly.platform.fig.face", { diameter: 0.16, segments: 8 }, scene);
    face.material = skin;
    face.parent = gate;
    face.position.set(-1.73, 1.62, 39.55);
    face.scaling.x = 0.25;
    const parts = [body, face];
    let gone = false;
    return {
      update() {
        if (gone) return;
        const d2 = player.position.subtract(face.getAbsolutePosition()).lengthSquared();
        if (d2 < 1.35) {
          gone = true;
          parts.forEach((p) => (p.isVisible = false));
        }
      },
      cleanup() {
        parts.forEach((p) => p.dispose());
        skin.dispose();
        cloth.dispose();
      },
    };
  },
};
