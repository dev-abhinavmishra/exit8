/**
 * niche.boots.extra — a second pair of work boots stands beside the
 * usual pair under the staff nook's stool. Same make, same wear —
 * and nobody else works this corridor.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef } from "./types";

export const nicheBootsExtra: AnomalyDef = {
  id: "niche.boots.extra",
  displayName: "A Second Pair of Boots",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [15, 100],
  requires: ["niche.boot.0"],
  excludes: ["niche.stool.down"],
  testSeed: "test.niche.boots.extra",
  dangerous: false,
  activate(ctx) {
    const src = ctx.world.registry.get("niche.boot.0") as TransformNode;
    const spawned: TransformNode[] = [];
    for (let i = 0; i < 2; i++) {
      const twin = src.clone(`niche.boot.extra.${i}`, null);
      if (!twin) continue;
      twin.parent = src.parent;
      twin.position.x = src.position.x - 0.02;
      twin.position.z = src.position.z + 0.42 + i * 0.11;
      twin.rotation.y = src.rotation.y + 0.3 - i * 0.12;
      spawned.push(twin);
    }
    return {
      update() {},
      cleanup() {
        for (const t of spawned) t.dispose();
      },
    };
  },
};
