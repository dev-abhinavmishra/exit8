/**
 * aid.gone — the first-aid cabinet on the east wall before the lift
 * lobby is not there. The pale wall behind it is blank where a white
 * box with a green cross used to be. Pure memorization.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";

export const aidGone: AnomalyDef = {
  id: "aid.gone",
  displayName: "Missing First Aid Cabinet",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["aid.cabinet"],
  excludes: [],
  testSeed: "test.aid.gone",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const unit = world.registry.get("aid.cabinet");
    unit.setEnabled(false);
    // second tells — the pale shadow outline where it hung + two screw
    // heads left in the tile
    const pp = unit.getAbsolutePosition();
    const ghostMat = new StandardMaterial("mat.anomaly.aidghost", ctx.scene);
    ghostMat.diffuseColor = new Color3(0.06, 0.065, 0.06);
    ghostMat.alpha = 0.42;
    ghostMat.backFaceCulling = false;
    const ghost = CreatePlane("anomaly.aid.ghost", { width: 0.32, height: 0.42 }, ctx.scene);
    ghost.material = ghostMat;
    ghost.position.set(pp.x - 0.035, pp.y, pp.z);
    ghost.rotation.y = Math.PI / 2; // east wall, face the corridor
    const screws: AbstractMesh[] = [];
    for (const dz of [-0.11, 0.11]) {
      const s = CreatePlane(`anomaly.aid.screw.${dz > 0 ? 1 : 0}`, { width: 0.03, height: 0.03 }, ctx.scene);
      s.material = ghostMat;
      s.position.set(pp.x - 0.034, pp.y + 0.14, pp.z + dz);
      s.rotation.y = Math.PI / 2;
      screws.push(s);
    }
    return {
      update() {},
      cleanup() {
        unit.setEnabled(true);
        ghost.dispose();
        screws.forEach((s) => s.dispose());
        ghostMat.dispose();
      },
    };
  },
};
