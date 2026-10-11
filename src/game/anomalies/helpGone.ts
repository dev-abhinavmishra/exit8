import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * help.gone — the whole help point is unbolted; a pale painted scar
 * shows on the west wall where it hung, cord stub dangling. Moderate.
 */
export const helpGone: AnomalyDef = {
  id: "help.gone",
  displayName: "The Help Point Is Gone",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["help.box"],
  excludes: ["help", "help.offhook", "help.torn"],
  testSeed: "test.help.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const box = ctx.world.registry.get("help.box");
    box.setEnabled(false);
    const scarMat = new StandardMaterial("mat.help.scar", ctx.scene);
    scarMat.diffuseColor = new Color3(0.68, 0.66, 0.6);
    scarMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const scar = CreateBox("anomaly.help.scar", { width: 0.012, height: 0.56, depth: 0.4 }, ctx.scene);
    scar.material = scarMat;
    scar.parent = ctx.world.root;
    const bp = box.getAbsolutePosition();
    scar.position.set(bp.x + (bp.x > 0 ? 0.02 : -0.02), bp.y, bp.z);
    return {
      update() {},
      cleanup() {
        box.setEnabled(true);
        scar.dispose();
        scarMat.dispose();
      },
    };
  },
};
