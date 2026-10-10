import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * patina.crack — a hairline crack JAGS DOWN the east wall at z 33 over
 * the first minute of the loop. Grows past any baseline hairline.
 * Spatial, moderate.
 */
export const patinaCrack: AnomalyDef = {
  id: "patina.crack",
  displayName: "The Wall Cracks Open",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["patina.crack"],
  excludes: [],
  testSeed: "test.patina.crack",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const anchor = ctx.world.registry.get("patina.crack");
    const mat = new StandardMaterial("mat.patina.live", ctx.scene);
    mat.diffuseColor = new Color3(0.03, 0.025, 0.02);
    mat.specularColor = Color3.Black();
    const c = CreateBox("anomaly.patina.crack", { width: 0.02, height: 1.4, depth: 0.014 }, ctx.scene);
    c.material = mat;
    c.parent = anchor;
    c.position.set(0, -0.7, 0);
    c.rotation.x = 0.08;
    let t = 0;
    return {
      update(dt: number) {
        t += dt;
        const grow = Math.min(1, t / 60);
        c.scaling.y = 0.15 + grow * 0.85;
        c.position.y = -0.7 * c.scaling.y;
      },
      cleanup() {
        c.dispose();
        mat.dispose();
      },
    };
  },
};
