/**
 * terminal.black — both airlock judgment terminals are dead. The
 * screens that read your verdicts to you are unlit glass; the corridor
 * runs the loop without showing its work.
 */
import type { Material } from "@babylonjs/core/Materials/material";
import type { AnomalyDef } from "./types";

export const terminalBlack: AnomalyDef = {
  id: "terminal.black",
  displayName: "Dead Terminals",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [15, 100],
  requires: ["al.north.terminal", "al.south.terminal"],
  excludes: ["terminal"],
  testSeed: "test.terminal.black",
  dangerous: false,
  activate(ctx) {
    const meshes = ["al.north.terminal", "al.south.terminal"].map(
      (n) => ctx.world.registry.get(n) as { material: Material | null },
    );
    const origs = meshes.map((m) => m.material);
    for (const m of meshes) m.material = ctx.world.materials.rubber;
    return {
      update() {},
      cleanup() {
        meshes.forEach((m, i) => (m.material = origs[i]!));
      },
    };
  },
};
