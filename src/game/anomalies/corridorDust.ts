import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.dust — a slow fall of pale grit through one troffer shaft
 * near the clock, visible only in the light. Subtle.
 */
export const corridorDust: AnomalyDef = {
  id: "corridor.dust",
  displayName: "Dust In The Light",
  chapter: 1,
  category: "spatial",
  detectability: "subtle",
  weight: 0.5,
  progressionRange: [20, 100],
  requires: ["clock.head"],
  excludes: [],
  testSeed: "test.corridor.dust",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const grit = new StandardMaterial("mat.corridor.grit", scene);
    grit.diffuseColor = new Color3(0.85, 0.82, 0.7);
    grit.emissiveColor = new Color3(0.3, 0.28, 0.2);
    const motes: { m: ReturnType<typeof CreateBox>; sp: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const m = CreateBox(`anomaly.corridor.mote.${i}`, { width: 0.012, height: 0.012, depth: 0.012 }, scene);
      m.material = grit;
      m.parent = world.root;
      m.position.set(0.55 + ((i * 0.11) % 0.7), 0.3 + ((i * 0.53) % 2.4), 29.6 + ((i * 0.13) % 0.8));
      motes.push({ m, sp: 0.12 + (i % 4) * 0.05 });
    }
    let t = 0;
    return {
      update(_dt: number) {
        t += _dt;
        motes.forEach(({ m, sp }, i) => {
          m.position.y -= sp * _dt;
          m.position.x += Math.sin(t * 0.9 + i * 2) * 0.06 * _dt;
          if (m.position.y < 0.05) m.position.y = 2.7;
        });
      },
      cleanup() {
        motes.forEach(({ m }) => m.dispose());
        grit.dispose();
      },
    };
  },
};
