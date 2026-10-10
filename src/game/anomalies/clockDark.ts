import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.dark — both clock faces have gone black, hands included. The
 * fixture is there; the light inside it is not. Subtle.
 */
export const clockDark: AnomalyDef = {
  id: "clock.dark",
  displayName: "The Faces Are Dark",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.55,
  progressionRange: [20, 100],
  requires: ["clock.head"],
  excludes: ["clock.drip"],
  testSeed: "test.clock.dark",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const head = world.registry.mesh("clock.head");
    const dark = new StandardMaterial("mat.clock.dark", scene);
    dark.diffuseColor = new Color3(0.05, 0.05, 0.055);
    dark.specularColor = Color3.Black();
    head.getChildMeshes(false).forEach((m) => {
      if (m.name.startsWith("clock.face.")) m.material = dark;
    });
    return {
      update() {},
      cleanup() {
        head.getChildMeshes(false).forEach((m) => {
          if (m.name.startsWith("clock.face.")) m.material = world.materials.trofferLit;
        });
        dark.dispose();
      },
    };
  },
};
