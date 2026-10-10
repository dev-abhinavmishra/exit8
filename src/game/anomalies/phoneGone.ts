/**
 * phone.gone — the corridor phone on the west wall, handset and all,
 * is simply not there. The wall plate it hung on is bare. Subtle
 * object-class anomaly.
 */
import type { AnomalyDef } from "./types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";

export const phoneGone: AnomalyDef = {
  id: "phone.gone",
  displayName: "Phone Missing",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["prop.phone"],
  excludes: ["phone.offhook"],
  testSeed: "test.phone.gone",
  dangerous: false,
  activate(ctx) {
    const node = ctx.world.registry.get("prop.phone");
    node.setEnabled(false);
    // second tells — the wall shadow where it hung + the cord left
    // dangling off the plate
    const pp = node.getAbsolutePosition();
    const ghostMat = new StandardMaterial("mat.anomaly.phghost", ctx.scene);
    ghostMat.diffuseColor = new Color3(0.05, 0.05, 0.055);
    ghostMat.alpha = 0.42;
    ghostMat.backFaceCulling = false;
    const ghost = CreatePlane("anomaly.phone.ghost", { width: 0.36, height: 0.54 }, ctx.scene);
    ghost.material = ghostMat;
    ghost.position.set(pp.x - 0.045, pp.y, pp.z);
    ghost.rotation.y = Math.PI / 2;
    const cord = CreateBox("anomaly.phone.cord", { width: 0.015, height: 0.3, depth: 0.015 }, ctx.scene);
    cord.material = ghostMat;
    cord.position.set(pp.x - 0.1, pp.y - 0.32, pp.z + 0.08);
    return {
      update() {},
      cleanup() {
        node.setEnabled(true);
        ghost.dispose();
        cord.dispose();
        ghostMat.dispose();
      },
    };
  },
};
