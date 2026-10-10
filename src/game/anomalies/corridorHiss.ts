import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.hiss — a steam jet spits from a joint in the red ceiling
 * pipe at z≈30 and rains a faint mist to the floor. Moderate.
 */
export const corridorHiss: AnomalyDef = {
  id: "corridor.hiss",
  displayName: "The Pipe Spits Steam",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["clock.head"],
  excludes: ["corridor.steam"],
  testSeed: "test.corridor.hiss",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const jet = new StandardMaterial("mat.corridor.jet", ctx.scene);
    jet.diffuseColor = new Color3(0.85, 0.88, 0.9);
    jet.specularColor = Color3.Black();
    jet.alpha = 0.3;
    const cone = CreateBox("anomaly.corridor.jet", { width: 0.1, height: 0.9, depth: 0.1 }, ctx.scene);
    cone.material = jet;
    cone.parent = ctx.world.root;
    cone.position.set(1.35, 2.2, 30.4);
    cone.rotation.z = 0.5;
    let t = 0;
    let heard = false;
    return {
      update(_dt: number) {
        t += _dt;
        const pulse = 0.75 + Math.sin(t * 6) * 0.25;
        cone.scaling.y = pulse;
        cone.scaling.x = cone.scaling.z = 1 + Math.sin(t * 9) * 0.3;
        jet.alpha = 0.22 + Math.sin(t * 6) * 0.08;
        if (!heard && t > 0.4) {
          heard = true;
          ctx.audio.caption("a pipe spits steam overhead", new Vector3(1.35, 2.2, 30.4));
        }
      },
      cleanup() {
        cone.dispose();
        jet.dispose();
      },
    };
  },
};
