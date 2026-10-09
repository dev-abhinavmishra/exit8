/**
 * gallery.frost — the observation glass has gone blind. Overnight the
 * gallery panes fogged solid: pale, opaque, warm to nobody. Whatever
 * the window looked onto cannot be looked at now.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Material } from "@babylonjs/core/Materials/material";
import type { AnomalyDef } from "./types";

export const galleryFrost: AnomalyDef = {
  id: "gallery.frost",
  displayName: "Blind Glass",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: ["wall.gallery.glass", "wall.gallery.glass.b", "wall.gallery.doorlite"],
  excludes: ["gallery", "gallery.door"],
  testSeed: "test.gallery.frost",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    // the glass run is three pieces since the staff door went in — frost
    // all of them or the doorway bay stays dark while the rest goes blind
    const panes = ["wall.gallery.glass", "wall.gallery.glass.b", "wall.gallery.doorlite"].map(
      (n) => world.registry.get(n) as { material: Material | null },
    );
    const origs = panes.map((p) => p.material);

    const frost = new StandardMaterial("anomaly.frost.mat", scene);
    frost.diffuseColor = new Color3(0.62, 0.64, 0.62);
    frost.specularColor = new Color3(0.05, 0.05, 0.05);
    frost.emissiveColor = new Color3(0.04, 0.04, 0.04);
    for (const p of panes) p.material = frost;

    return {
      update() {},
      cleanup() {
        panes.forEach((p, i) => (p.material = origs[i] ?? null));
        frost.dispose();
      },
    };
  },
};
