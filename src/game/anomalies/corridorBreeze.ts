import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.breeze — paper scraps skate slowly up the corridor on a
 * draft, tumbling off the terrazzo. Reads moving at a glance. Moderate.
 */
export const corridorBreeze: AnomalyDef = {
  id: "corridor.breeze",
  displayName: "A Draft Runs The Floor",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["svc.vent.0"],
  excludes: ["corridor.steam"],
  testSeed: "test.corridor.breeze",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const paper = new StandardMaterial("mat.corridor.scrap", scene);
    paper.diffuseColor = new Color3(0.82, 0.8, 0.74);
    paper.specularColor = Color3.Black();
    const scraps: { m: ReturnType<typeof CreateBox>; sp: number; ph: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const s = CreateBox(`anomaly.corridor.scrap.${i}`, { width: 0.16, height: 0.006, depth: 0.12 }, scene);
      s.material = paper;
      s.parent = world.root;
      s.position.set(-0.5 + (i % 3) * 0.5, 0.015, 44 - i * 6);
      scraps.push({ m: s, sp: 0.6 + (i % 3) * 0.35, ph: i * 2.1 });
    }
    return {
      update(_dt: number) {
        scraps.forEach(({ m, sp, ph }, i) => {
          m.position.z -= sp * _dt;
          m.position.y = 0.015 + Math.max(0, Math.sin(m.position.z * 2 + ph)) * 0.05;
          m.rotation.y = Math.sin(m.position.z * 0.8 + i) * 0.9;
          m.rotation.z = Math.sin(m.position.z * 1.7 + ph) * 0.15;
          if (m.position.z < 6) m.position.z = 52;
        });
      },
      cleanup() {
        scraps.forEach(({ m }) => m.dispose());
        paper.dispose();
      },
    };
  },
};
