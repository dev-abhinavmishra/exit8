/**
 * notice.gone — the DIVERGENCE POINT sign overhead inside the north
 * airlock is simply not there; bare lintel where the turn-back board
 * hung. Subtle spatial-class anomaly.
 */
import type { AnomalyDef } from "./types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";

export const noticeGone: AnomalyDef = {
  id: "notice.gone",
  displayName: "North Vestibule Sign Missing",
  chapter: 2,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [15, 100],
  requires: ["sign.sign.diverge.north"],
  excludes: ["sign", "notice.amends"],
  testSeed: "test.notice.gone",
  dangerous: false,
  activate(ctx) {
    const mesh = ctx.world.registry.mesh("sign.sign.diverge.north");
    mesh.setEnabled(false);
    // second tells — the ghost outline where it hung + a scrap on the
    // vestibule floor beneath
    const pp = mesh.getAbsolutePosition();
    const ghostMat = new StandardMaterial("mat.anomaly.ghost", ctx.scene);
    ghostMat.diffuseColor = new Color3(0.05, 0.05, 0.055);
    ghostMat.alpha = 0.4;
    const ghost = CreatePlane("anomaly.notice.ghost", { width: 1.28, height: 0.38 }, ctx.scene);
    ghost.material = ghostMat;
    ghostMat.backFaceCulling = false;
    ghost.position.set(pp.x, pp.y, pp.z - 0.02);
    ghost.rotation.y = Math.PI; // faces +z, the corridor approach
    const scrap = CreatePlane("anomaly.notice.scrap", { width: 0.3, height: 0.12 }, ctx.scene);
    scrap.material = ghostMat;
    scrap.position.set(pp.x + 0.3, 0.007, pp.z + 0.9);
    scrap.rotation.x = -Math.PI / 2;
    scrap.rotation.z = 0.7;
    return {
      update() {},
      cleanup() {
        mesh.setEnabled(true);
        ghost.dispose();
        scrap.dispose();
        ghostMat.dispose();
      },
    };
  },
};
