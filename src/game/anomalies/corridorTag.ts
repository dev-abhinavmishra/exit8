import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.tag — a fresh spray tag scrawled across the west wall above
 * the baseboard at z 24: a looping throw-up, still glossy wet. Moderate.
 */
export const corridorTag: AnomalyDef = {
  id: "corridor.tag",
  displayName: "Fresh Paint",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["svc.vent.1"],
  excludes: [],
  testSeed: "test.corridor.tag",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const ink = new StandardMaterial("mat.corridor.ink", scene);
    ink.diffuseColor = new Color3(0.72, 0.06, 0.06);
    ink.emissiveColor = new Color3(0.18, 0.02, 0.02);
    ink.specularColor = new Color3(0.35, 0.2, 0.2);
    ink.specularPower = 4;
    const strokes: ReturnType<typeof CreateBox>[] = [];
    const segs = [
      [0.9, 0.07, 0.9, 0.4], // tall slash
      [1.1, 0.42, 0.5, 0.12], // cross bar
      [0.7, -0.34, 0.55, -0.4], // underline loop
    ];
    segs.forEach(([w, h, z, ry], i) => {
      const s = CreateBox(`anomaly.corridor.ink.${i}`, { width: 0.02, height: w!, depth: h! + 0.5 }, scene);
      s.material = ink;
      s.parent = world.root;
      s.position.set(-1.75, 1.05 + h!, 24 + z!);
      s.rotation.x = ry!;
      strokes.push(s);
    });
    // drips running off the strokes
    for (let i = 0; i < 3; i++) {
      const d = CreateBox(
        `anomaly.corridor.inkdrip.${i}`,
        { width: 0.012, height: 0.22 - i * 0.05, depth: 0.02 },
        scene,
      );
      d.material = ink;
      d.parent = world.root;
      d.position.set(-1.75, 0.7 - i * 0.03, 23.72 + i * 0.3);
      strokes.push(d);
    }
    return {
      update() {},
      cleanup() {
        strokes.forEach((s) => s.dispose());
        ink.dispose();
      },
    };
  },
};
