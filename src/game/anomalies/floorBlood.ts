/**
 * floor.blood — something was dragged down the corridor: a wide
 * arterial smear down the walk path, darker pools where it pooled,
 * and the streak veers toward the washroom door. Unmistakable.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const floorBlood: AnomalyDef = {
  id: "floor.blood",
  displayName: "Blood on the Floor",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["guide.seg.0"],
  excludes: ["floor.flood", "corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.floor.blood",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    const bloodMat = new StandardMaterial("mat.anomaly.blood", scene);
    bloodMat.diffuseColor = new Color3(0.11, 0.014, 0.011);
    bloodMat.specularColor = new Color3(0.6, 0.15, 0.12);
    bloodMat.specularPower = 12;
    bloodMat.emissiveColor = new Color3(0.02, 0.002, 0.001);
    bloodMat.alpha = 1.0;
    const darkMat = new StandardMaterial("mat.anomaly.blood.dark", scene);
    darkMat.diffuseColor = new Color3(0.1, 0.008, 0.006);
    darkMat.specularColor = new Color3(0.5, 0.1, 0.08);
    darkMat.specularPower = 14;
    darkMat.emissiveColor = new Color3(0.014, 0.001, 0.001);
    darkMat.alpha = 1.0;
    const made: AbstractMesh[] = [];
    // flat boxes, not planes — the corridor's kit renders boxes at
    // floor level reliably (guide.seg); CreatePlane decals here have
    // proven unreliable under the merged floor pass
    const put = (w: number, h: number, x: number, z: number, mat: StandardMaterial, rz = 0) => {
      const p = CreateBox(`anomaly.blood.${made.length}`, { width: w, height: 0.008, depth: h }, scene);
      p.material = mat;
      p.position.set(x, 0.012 + made.length * 0.0015, z);
      p.rotation.y = rz;
      made.push(p);
      return p;
    };
    // the drag — a long uneven smear down the walk lane z12→20
    put(0.7, 8.0, 0.15, 16.2, bloodMat, 0.05);
    // darker pooling where it sat
    put(0.95, 1.3, 0.1, 13.6, darkMat, 0.2);
    put(0.8, 1.1, 0.3, 18.9, darkMat, -0.15);
    // and it veers toward the washroom mouth
    put(0.42, 2.3, 0.85, 19.6, bloodMat, -0.62);
    put(0.5, 0.9, 1.55, 18.85, darkMat, -0.3);
    return {
      update() {},
      cleanup() {
        made.forEach((m) => m.dispose());
        bloodMat.dispose();
        darkMat.dispose();
      },
    };
  },
};
