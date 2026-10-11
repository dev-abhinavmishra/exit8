import { Color3 } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * help.rings — the call lamp keeps pulsing a slow amber rhythm all
 * loop, like a ring tone nobody picks up. Moderate — the pulse is on a
 * small dome, you have to catch the beat.
 */
export const helpRings: AnomalyDef = {
  id: "help.rings",
  displayName: "It Rings For Nobody",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["help.lamp"],
  excludes: ["help", "help.lit", "help.voice"],
  testSeed: "test.help.rings",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const lamp = ctx.world.registry.get("help.lamp") as AbstractMesh;
    const mat = lamp.material as StandardMaterial;
    const e0 = mat.emissiveColor.clone();
    let t = 0;
    return {
      update(dt: number) {
        t += dt;
        const on = Math.sin(t * 4.2) > 0.4;
        mat.emissiveColor = on ? new Color3(0.95, 0.55, 0.12) : e0;
      },
      cleanup() {
        mat.emissiveColor = e0;
      },
    };
  },
};
