/**
 * poster.backs — every poster in the row has been hung face-in, showing a
 * plain card back. Unmistakable once you glance at the wall, easy to miss
 * if you only memorized the row's rhythm.
 */
import { DynamicTexture, StandardMaterial, Color3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";
import type { Material } from "@babylonjs/core";

export const posterBacks: AnomalyDef = {
  id: "poster.backs",
  displayName: "Posters Face-In",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["poster.0"],
  excludes: [
    "poster.missing",
    "poster.dup",
    "poster.grin",
    "poster.swapped",
    "poster.watches",
    "poster.changed",
    "poster.tilted",
    "poster.hollow",
    "posters.mirror",
  ],
  testSeed: "test.poster.backs",
  dangerous: false,
  activate(ctx) {
    const names: string[] = [];
    for (let i = 0; ctx.world.registry.has(`poster.${i}`); i++) names.push(`poster.${i}`);
    const saved = new Map<string, Material | null>();
    const { scene } = ctx;
    const back = new StandardMaterial("anom-poster-back", scene);
    back.diffuseColor = new Color3(0.82, 0.79, 0.7);
    back.specularColor = new Color3(0.02, 0.02, 0.02);
    back.roughness = 0.9;
    const tex = new DynamicTexture("anom-poster-back-tex", { width: 256, height: 384 }, scene);
    const t = tex.getContext();
    t.fillStyle = "#cfc9b8";
    t.fillRect(0, 0, 256, 384);
    // card-back lip + a faint glue ghost where the print used to be
    t.strokeStyle = "rgba(120,112,96,0.5)";
    t.lineWidth = 6;
    t.strokeRect(8, 8, 240, 368);
    t.fillStyle = "rgba(160,152,132,0.18)";
    t.fillRect(24, 24, 208, 336);
    tex.update();
    back.diffuseTexture = tex;
    for (const n of names) {
      const m = ctx.world.registry.mesh(n);
      saved.set(n, m.material);
      m.material = back;
    }
    return {
      update() {},
      cleanup() {
        for (const n of names) {
          ctx.world.registry.mesh(n).material = saved.get(n) ?? null;
        }
        back.dispose();
      },
    };
  },
};
