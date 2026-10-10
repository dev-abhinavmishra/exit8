import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.steam — white wisps lift out of the east floor vent at z37,
 * curling and thinning as they climb. Moderate.
 */
export const corridorSteam: AnomalyDef = {
  id: "corridor.steam",
  displayName: "Steam Off The Grate",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["svc.vent.0"],
  excludes: [],
  testSeed: "test.corridor.steam",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const steam = new StandardMaterial("mat.corridor.steam", scene);
    steam.diffuseColor = new Color3(0.8, 0.85, 0.88);
    steam.specularColor = Color3.Black();
    steam.alpha = 0.16;
    const wisps: { m: ReturnType<typeof CreateBox>; ph: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const w = CreateBox(`anomaly.corridor.wisp.${i}`, { width: 0.05, height: 0.9 + i * 0.1, depth: 0.05 }, scene);
      w.material = steam;
      w.parent = world.root;
      w.position.set(1.55 - i * 0.09, 0.6, 36.9 + (i % 3) * 0.16);
      wisps.push({ m: w, ph: i * 1.3 });
    }
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        wisps.forEach(({ m, ph }, i) => {
          const rise = ((t * 0.55 + ph) % 2.4) / 2.4;
          m.position.y = 0.4 + rise * 2.0;
          m.scaling.x = m.scaling.z = 1 + rise * 2.6;
          m.rotation.y = t * 0.4 + i;
          m.position.x = 1.55 - i * 0.09 - Math.sin(t * 0.7 + i) * 0.1;
        });
        steam.alpha = 0.13 + Math.sin(t * 1.1) * 0.05;
      },
      cleanup() {
        wisps.forEach(({ m }) => m.dispose());
        steam.dispose();
      },
    };
  },
};
