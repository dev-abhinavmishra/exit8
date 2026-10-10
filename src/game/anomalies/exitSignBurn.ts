import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * exit.sign.burn — the south EXIT sign glows wrong: a red film lies
 * over its face so the whole south end reads ember-lit. Chapter III /
 * moderate.
 */
export const exitSignBurn: AnomalyDef = {
  id: "exit.sign.burn",
  displayName: "The Sign Burns Red",
  chapter: 3,
  category: "lighting",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["sign.sign.exit.south"],
  excludes: ["exit.sign.gone", "exit.wrongway"],
  testSeed: "test.exit.sign.burn",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const sign = ctx.world.registry.get("sign.sign.exit.south");
    const film = new StandardMaterial("mat.exit.film", ctx.scene);
    film.diffuseColor = new Color3(0.7, 0.05, 0.04);
    film.emissiveColor = new Color3(0.35, 0.02, 0.01);
    film.alpha = 0.55;
    const pane = CreateBox("anomaly.exit.film", { width: 0.02, height: 0.5, depth: 1.1 }, ctx.scene);
    pane.material = film;
    pane.parent = sign.parent;
    pane.position.copyFrom(sign.position);
    pane.position.y -= 0.1;
    return {
      update() {},
      cleanup() {
        pane.dispose();
        film.dispose();
      },
    };
  },
};
