/**
 * supply.lit — the caged dome inside the cage is burning tonight and
 * the pilot lamp runs hot amber: warm light spills through the grille
 * bars across the stock shelves. The cage is always dark. Moderate
 * lighting-class.
 */
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Vector3 } from "@babylonjs/core";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const supplyLit: AnomalyDef = {
  id: "supply.lit",
  displayName: "The Cage Is Lit",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["supply.lamp", "supply.pilot"],
  // scene-space PointLight can't follow corridor.mirror's flip
  excludes: ["corridor.mirror", "supply.open"],
  testSeed: "test.supply.lit",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const lamp = world.registry.mesh("supply.lamp");
    const pilot = world.registry.mesh("supply.pilot");
    const lampMat = lamp.material as StandardMaterial;
    const pilotMat = pilot.material as StandardMaterial;
    const lampSaved = lampMat.emissiveColor.clone();
    const pilotSaved = pilotMat.emissiveColor.clone();
    lampMat.emissiveColor = new Color3(0.65, 0.4, 0.14);
    pilotMat.emissiveColor = new Color3(0.75, 0.5, 0.12);
    const glow = new PointLight("anomaly.supply.glow", new Vector3(2.7, 2.0, 35.0), scene);
    glow.diffuse = new Color3(1.0, 0.72, 0.36);
    glow.intensity = 0.5;
    glow.range = 3.2;
    return {
      update(_dt) {
        glow.intensity = 0.5 + Math.sin(performance.now() * 0.0021) * 0.07;
      },
      cleanup() {
        lampMat.emissiveColor = lampSaved;
        pilotMat.emissiveColor = pilotSaved;
        glow.dispose();
      },
    };
  },
};
