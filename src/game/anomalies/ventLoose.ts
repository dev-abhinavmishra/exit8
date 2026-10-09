/**
 * vent.loose — the east-wall grille at z≈30 has let go of three screws
 * and hangs tilted off the last one, the dark duct gaping behind it.
 * Moderate: a fixture that sat flush now leans into the corridor.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

const GRILLE = "vent.grille.1"; // east wall, z≈30 — mid-route sightline
const TILT = 0.3;

export const ventLoose: AnomalyDef = {
  id: "vent.loose",
  displayName: "Loose Vent",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: [GRILLE],
  excludes: ["vent.slats"],
  testSeed: "test.vent.loose",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const g = world.registry.mesh(GRILLE) as AbstractMesh;
    const gy = g.position.y;
    const gz = g.position.z;
    // swing the grille's slats onto it so they ride the tilt
    const riders: AbstractMesh[] = [];
    for (let s = 0; s < 4; s++) {
      const sl = scene.getMeshByName(`vent.grille.1.slat.${s}`) as AbstractMesh | null;
      if (sl) {
        sl.setParent(g);
        riders.push(sl);
      }
    }
    // hinge on the top-north corner: rotate in-plane (wall normal = x),
    // then re-place the mesh so that corner stays pinned to the wall
    const px = g.position.x;
    const py = gy + 0.18;
    const pz = gz - 0.4;
    const dy = gy - py;
    const dz = gz - pz;
    const cos = Math.cos(TILT);
    const sin = Math.sin(TILT);
    g.rotation.x = TILT;
    g.position.y = py + dy * cos - dz * sin;
    g.position.z = pz + dy * sin + dz * cos;
    // the duct mouth the grille used to cover — a near-black inset
    const holeMat = new StandardMaterial("anomaly.vent.hole.mat", scene);
    holeMat.diffuseColor = new Color3(0.006, 0.006, 0.007);
    holeMat.specularColor = new Color3(0, 0, 0);
    holeMat.emissiveColor = new Color3(0.004, 0.005, 0.007);
    const hole = CreatePlane("anomaly.vent.hole", { width: 0.8, height: 0.34 }, scene);
    hole.material = holeMat;
    // east wall — the hole faces −x back into the corridor
    hole.rotation.y = Math.PI / 2;
    hole.position.set(px - 0.02, gy, gz);
    return {
      update() {},
      cleanup() {
        hole.dispose();
        holeMat.dispose();
        g.rotation.x = 0;
        g.position.y = gy;
        g.position.z = gz;
        for (const sl of riders) sl.setParent(world.root);
      },
    };
  },
};
