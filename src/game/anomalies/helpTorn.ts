import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * help.torn — the speaker grille is wrenched off and lying on the
 * floor; a dead black cavity gapes where the speaker sat. Moderate.
 */
export const helpTorn: AnomalyDef = {
  id: "help.torn",
  displayName: "The Grille Is Torn",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["help.grille"],
  excludes: ["help", "help.gone"],
  testSeed: "test.help.torn",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const grille = ctx.world.registry.get("help.grille");
    grille.setEnabled(false);
    const darkMat = new StandardMaterial("mat.help.cavity", ctx.scene);
    darkMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    darkMat.specularColor = new Color3(0, 0, 0);
    const cavity = CreateBox("anomaly.help.cavity", { width: 0.15, height: 0.09, depth: 0.02 }, ctx.scene);
    cavity.material = darkMat;
    cavity.parent = ctx.world.root;
    const gp = grille.getAbsolutePosition();
    const dir = gp.x > 0 ? -1 : 1;
    cavity.position.set(gp.x + 0.01 * dir, gp.y, gp.z);
    cavity.rotation.y = gp.x > 0 ? -Math.PI / 2 : Math.PI / 2;
    const plate = CreateBox("anomaly.help.plate", { width: 0.02, height: 0.1, depth: 0.16 }, ctx.scene);
    plate.material = darkMat;
    plate.parent = ctx.world.root;
    plate.position.set(gp.x + 0.4 * dir, 0.015, gp.z + 0.2);
    plate.rotation.x = Math.PI / 2;
    plate.rotation.z = 0.3;
    return {
      update() {},
      cleanup() {
        grille.setEnabled(true);
        cavity.dispose();
        plate.dispose();
        darkMat.dispose();
      },
    };
  },
};
