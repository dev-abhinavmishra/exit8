/**
 * walker.long — the other inspector still patrols, but his proportions
 * went wrong: arms stretched past the knees, legs stilted, head hung a
 * little too low. He walks like nothing changed. Unmistakable.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const walkerLong: AnomalyDef = {
  id: "walker.long",
  displayName: "Stretched Inspector",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["ambient.walker"],
  excludes: ["walker", "creature", "figure", "corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.walker.long",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const walker = ctx.world.registry.get("ambient.walker");
    const parts = walker
      .getDescendants(false)
      .filter((n): n is TransformNode => "scaling" in n && /\.(hip\.|arm\.|headPivot$)/.test(n.name));
    const saved = parts.map((n) => ({ n, s: n.scaling.clone(), p: n.position.clone() }));
    for (const n of parts) {
      if (n.name.includes(".hip.")) {
        n.scaling.y = 1.42; // legs run stilted
        n.position.y += 0.31; // hips ride higher off the floor
      } else if (n.name.includes(".arm.")) {
        n.scaling.y = 1.75; // hands dangle past the knees
      } else if (n.name.endsWith("headPivot")) {
        n.position.z += 0.09; // head carried low and forward
        n.position.y -= 0.05;
      }
    }
    return {
      update() {},
      cleanup() {
        saved.forEach(({ n, s, p }) => {
          n.scaling = s;
          n.position = p;
        });
      },
    };
  },
};
