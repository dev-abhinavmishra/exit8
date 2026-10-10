/**
 * shutter.breach — the clerk desk's roller shutter is forced: wrenched
 * half up and bent off its track, one slat dropped on the counter
 * below. The desk is dark, just open — this isn't the lit-desk read,
 * it's the broke-in read. Moderate object-class.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const shutterBreach: AnomalyDef = {
  id: "shutter.breach",
  displayName: "The Shutter Is Forced",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["wicket.shutter", "wicket.win"],
  excludes: ["wicket.lit"],
  testSeed: "test.shutter.breach",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const shutter = world.registry.mesh("wicket.shutter");
    const savedY = shutter.position.y;
    const savedRot = shutter.rotation.z;
    // wrenched half up and racked off level
    shutter.position.y = savedY + 0.34;
    shutter.rotation.z = -0.07;
    // a slat dropped on the counter beneath it — second tell
    const slat = CreateBox("anomaly.shutter.slat", { width: 0.03, height: 0.035, depth: 0.9 }, scene);
    slat.material = world.materials.rubber;
    slat.parent = world.root;
    slat.position.set(1.34, 1.07, 12.44);
    slat.rotation.y = 0.35;
    return {
      update() {},
      cleanup() {
        shutter.position.y = savedY;
        shutter.rotation.z = savedRot;
        slat.dispose();
      },
    };
  },
};
