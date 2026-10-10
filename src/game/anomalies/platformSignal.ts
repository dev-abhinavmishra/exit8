import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * platform.signal — the pinprick down the track doubles: two reds,
 * a body apart. Subtle.
 */
export const platformSignal: AnomalyDef = {
  id: "platform.signal",
  displayName: "Two Signals",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.55,
  progressionRange: [15, 100],
  requires: ["platform.signal"],
  excludes: [],
  testSeed: "test.platform.signal",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const sig = ctx.world.registry.get("platform.signal");
    const mat2 = new StandardMaterial("mat.platform.signal2", ctx.scene);
    mat2.diffuseColor = Color3.Black();
    mat2.emissiveColor = new Color3(0.9, 0.1, 0.08);
    const twin = CreateSphere("anomaly.platform.signal2", { diameter: 0.03, segments: 6 }, ctx.scene);
    twin.material = mat2;
    twin.parent = sig.parent;
    twin.position.set(-1.96, 1.15, 39.88 + 0.42);
    return {
      update() {},
      cleanup() {
        twin.dispose();
        mat2.dispose();
      },
    };
  },
};
