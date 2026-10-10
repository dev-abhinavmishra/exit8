/**
 * wicket.lit — the ROUTE 7 desk is burning its interior lamp tonight:
 * the shutter is up a hand's width, amber light bleeds under it onto
 * the counter, and the hood lamp over the window is lit. The desk
 * should be dead. Moderate lighting-class.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const wicketLit: AnomalyDef = {
  id: "wicket.lit",
  displayName: "The Desk Is Lit",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["wicket.shutter", "wicket.win", "wicket.lamp"],
  // scene-space PointLight can't follow corridor.mirror's flip — the
  // glow would pool off the flipped booth (scene-light trap)
  excludes: ["corridor.mirror", "shutter.breach"],
  testSeed: "test.wicket.lit",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    // shutter rides up a hand's width — a lit slice shows under it
    const shutter = world.registry.mesh("wicket.shutter");
    const shutterY = shutter.position.y;
    shutter.position.y = shutterY + 0.42;
    // amber interior burning behind the glass
    const win = world.registry.mesh("wicket.win");
    const wm = win.material as StandardMaterial;
    const winSaved = wm.emissiveColor.clone();
    wm.emissiveColor = new Color3(0.5, 0.32, 0.12);
    // hood lamp lit — dedicated light so zone kills can't touch it
    const lamp = world.registry.mesh("wicket.lamp");
    const lm = lamp.material as StandardMaterial;
    const lampSaved = lm.emissiveColor.clone();
    lm.emissiveColor = new Color3(0.6, 0.45, 0.2);
    const glow = new PointLight("anomaly.wicket.glow", new Vector3(1.3, 1.5, 12.5), scene);
    glow.diffuse = new Color3(0.6, 0.38, 0.15);
    glow.intensity = 0.45;
    glow.range = 3.5;
    let t = 0;
    return {
      update(dt: number) {
        // the lamp's flame isn't steady — a slow brown sag
        t += dt;
        glow.intensity = 0.45 + Math.sin(t * 2.3) * 0.08;
      },
      cleanup() {
        shutter.position.y = shutterY;
        wm.emissiveColor = winSaved;
        lm.emissiveColor = lampSaved;
        glow.dispose();
      },
    };
  },
};
