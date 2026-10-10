import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";
import type { AbstractMesh } from "@babylonjs/core";

/**
 * patina.patch.gone — the mismatched repair tile on the west wall z 28
 * has fallen out: bare grey substrate behind, and the tile itself lies
 * on the floor below. Subtle.
 */
export const patinaPatch: AnomalyDef = {
  id: "patina.patch.gone",
  displayName: "The Repair Fell Out",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["patina.patch"],
  excludes: [],
  testSeed: "test.patina.patch",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const patch = ctx.world.registry.get("patina.patch");
    patch.setEnabled(false);
    const bare = new StandardMaterial("mat.patina.bare", ctx.scene);
    bare.diffuseColor = new Color3(0.16, 0.15, 0.13);
    bare.specularColor = new Color3(0.02, 0.02, 0.02);
    const hole = CreateBox("anomaly.patina.hole", { width: 0.02, height: 0.4, depth: 0.48 }, ctx.scene);
    hole.material = bare;
    hole.parent = ctx.world.root;
    const p = patch.getAbsolutePosition();
    const patchMesh = patch as AbstractMesh;
    hole.position.set(p.x + 0.002, p.y, p.z);
    const tile = CreateBox("anomaly.patina.tile", { width: 0.02, height: 0.4, depth: 0.48 }, ctx.scene);
    tile.material = patchMesh.material;
    tile.parent = ctx.world.root;
    tile.position.set(p.x + 0.35, 0.02, p.z + 0.15);
    tile.rotation.x = Math.PI / 2;
    tile.rotation.z = 0.12;
    return {
      update() {},
      cleanup() {
        patch.setEnabled(true);
        hole.dispose();
        tile.dispose();
        bare.dispose();
      },
    };
  },
};
