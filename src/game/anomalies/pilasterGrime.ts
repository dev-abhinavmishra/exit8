/**
 * pilaster.grime — the east column at z≈16.5 is filmed head to base in
 * oily grime and its steel cap band is gone. Subtle-tier with a second
 * tell (the missing cap) per the obvious-first law.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { Material, Nullable } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const pilasterGrime: AnomalyDef = {
  id: "pilaster.grime",
  displayName: "The Column Is Filmed",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.5,
  progressionRange: [20, 100],
  requires: ["col.e.0"],
  excludes: [],
  testSeed: "test.pilaster.grime",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const col = world.registry.mesh("col.e.0");
    const grime = new StandardMaterial("mat.pilaster.grime", scene);
    grime.diffuseColor = new Color3(0.13, 0.12, 0.1);
    grime.specularColor = new Color3(0.25, 0.22, 0.18);
    const saved: Nullable<Material>[] = [];
    col.getChildMeshes(false).forEach((ch) => {
      saved.push(ch.material);
      if (ch.name.endsWith(".cap")) {
        ch.setEnabled(false);
      } else ch.material = grime;
    });
    return {
      update() {},
      cleanup() {
        col.getChildMeshes(false).forEach((ch, i) => {
          ch.setEnabled(true);
          if (saved[i]) ch.material = saved[i]!;
        });
        grime.dispose();
      },
    };
  },
};
