import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * patina.scratch — three fresh parallel gouges scored across the
 * walkway ahead of the wicket at z 30: bright-cut edges that glint.
 * Subtle.
 */
export const patinaScratch: AnomalyDef = {
  id: "patina.scratch",
  displayName: "Scored Across The Floor",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["wicket.lamp"],
  excludes: [],
  testSeed: "test.patina.scratch",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const cut = new StandardMaterial("mat.patina.cut", ctx.scene);
    cut.diffuseColor = new Color3(0.3, 0.28, 0.24);
    cut.specularColor = new Color3(0.6, 0.55, 0.45);
    cut.specularPower = 24;
    const made: { dispose(): void }[] = [];
    for (let i = 0; i < 3; i++) {
      const g = CreateBox(`anomaly.patina.gouge.${i}`, { width: 0.03, height: 0.006, depth: 1.5 }, ctx.scene);
      g.material = cut;
      g.parent = ctx.world.root;
      g.position.set(-0.25 + i * 0.3, 0.014, 30.2 + i * 0.08);
      g.rotation.y = 0.32;
      made.push(g);
    }
    return {
      update() {},
      cleanup() {
        made.forEach((m) => m.dispose());
        cut.dispose();
      },
    };
  },
};
