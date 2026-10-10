import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * patina.rust — a FRESH rust weep runs down the west wall at z 48 —
 * brighter than every aged weep on the loop and still wet-shiny.
 * Subtle.
 */
export const patinaRust: AnomalyDef = {
  id: "patina.rust.fresh",
  displayName: "A Fresh Rust Run",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["svc.jbox.1"],
  excludes: [],
  testSeed: "test.patina.rust",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const rust = new StandardMaterial("mat.patina.wet", ctx.scene);
    rust.diffuseColor = new Color3(0.55, 0.24, 0.07);
    rust.specularColor = new Color3(0.5, 0.35, 0.2);
    rust.specularPower = 16;
    const w = CreateBox("anomaly.patina.weep", { width: 0.013, height: 0.9, depth: 0.07 }, ctx.scene);
    w.material = rust;
    w.parent = ctx.world.root;
    w.position.set(-(1.8 - 0.05), 1.05, 48.3);
    return {
      update() {},
      cleanup() {
        w.dispose();
        rust.dispose();
      },
    };
  },
};
