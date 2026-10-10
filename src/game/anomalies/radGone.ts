/**
 * rad.gone — the panel radiator on the east wall, the one you pass
 * in the first quarter of the route every loop, is simply not
 * there. Bare wall where it always stood. Subtle object-class
 * anomaly.
 */
import type { AnomalyDef } from "./types";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";

export const radGone: AnomalyDef = {
  id: "rad.gone",
  displayName: "Missing Radiator",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["rad.unit"],
  excludes: ["rad.leaks"],
  testSeed: "test.rad.gone",
  dangerous: false,
  activate(ctx) {
    const node = ctx.world.registry.get("rad.unit");
    node.setEnabled(false);
    // second tells — the long shadow where it stood + the supply stubs
    // still sticking out of the wall base
    const pp = node.getAbsolutePosition();
    const ghostMat = new StandardMaterial("mat.anomaly.radghost", ctx.scene);
    ghostMat.diffuseColor = new Color3(0.05, 0.05, 0.055);
    ghostMat.alpha = 0.4;
    ghostMat.backFaceCulling = false;
    const ghost = CreatePlane("anomaly.rad.ghost", { width: 1.82, height: 0.52 }, ctx.scene);
    ghost.material = ghostMat;
    ghost.position.set(pp.x - 0.055, pp.y + 0.42, pp.z);
    ghost.rotation.y = Math.PI / 2; // width already runs along the wall
    const stubs: AbstractMesh[] = [];
    for (const dz of [-0.62, 0.62]) {
      const st = CreateBox(
        `anomaly.rad.stub.${dz > 0 ? 1 : 0}`,
        { width: 0.05, height: 0.12, depth: 0.05 },
        ctx.scene,
      );
      st.material = ghostMat;
      st.position.set(pp.x - 0.09, 0.06, pp.z + dz);
      stubs.push(st);
    }
    return {
      update() {},
      cleanup() {
        node.setEnabled(true);
        ghost.dispose();
        stubs.forEach((s) => s.dispose());
        ghostMat.dispose();
      },
    };
  },
};
