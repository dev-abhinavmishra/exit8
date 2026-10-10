/**
 * archives.dark — the stacks room's lamp has gone out. The wash on the
 * back wall, the pad underfoot, the lit desk face — all of it drains to
 * a dark mouth in the bank face, door still shut. Subtle-moderate: a
 * room that had a light now reads as a hole in the records bank.
 */
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DARK_MATS = ["mat.archives.wash", "mat.archives.pad"];

export const archivesDark: AnomalyDef = {
  id: "archives.dark",
  displayName: "Dark Stacks",
  chapter: 2,
  category: "lighting",
  detectability: "subtle",
  weight: 1,
  progressionRange: [12, 100],
  requires: ["archives.door.leaf"],
  excludes: ["archives.open", "archives.staffed", "archives.slam", "lights.blackout"],
  testSeed: "test.archives.dark",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    const saved: [StandardMaterial, Color3][] = [];
    for (const n of DARK_MATS) {
      const m = scene.getMaterialByName(n) as StandardMaterial | null;
      if (m) {
        saved.push([m, m.emissiveColor.clone()]);
        m.emissiveColor.scaleInPlace(0.04);
      }
    }
    return {
      update() {},
      cleanup() {
        for (const [m, c] of saved) m.emissiveColor = c;
      },
    };
  },
};
