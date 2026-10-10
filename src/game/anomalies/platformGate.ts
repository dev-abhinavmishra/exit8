import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * platform.gate — the middle bar is sprung outward from its foot,
 * bowing into the corridor with the gap dark behind it. Moderate.
 */
export const platformGate: AnomalyDef = {
  id: "platform.gate",
  displayName: "A Bar Sprung",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["platform.bar.2"],
  excludes: [],
  testSeed: "test.platform.gate",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const bar = ctx.world.registry.get("platform.bar.2");
    const saved = bar.rotation.clone();
    const savedPos = bar.position.clone();
    bar.rotation.z = -0.22;
    bar.position.x += 0.16;
    // and a glint of pale flesh/edge at the sprung foot — something used it
    const scratch = new StandardMaterial("mat.platform.glint", ctx.scene);
    scratch.diffuseColor = new Color3(0.6, 0.62, 0.6);
    scratch.emissiveColor = new Color3(0.1, 0.1, 0.09);
    const glint = CreateBox("anomaly.platform.glint", { width: 0.02, height: 0.22, depth: 0.05 }, ctx.scene);
    glint.material = scratch;
    glint.parent = bar.parent;
    glint.position.set(-1.9, 0.28, 39.7);
    return {
      update() {},
      cleanup() {
        bar.rotation = saved;
        bar.position = savedPos;
        glint.dispose();
        scratch.dispose();
      },
    };
  },
};
