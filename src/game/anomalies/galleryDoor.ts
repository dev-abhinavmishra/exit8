/**
 * gallery.door — the glazed staff door in the observation glass stands
 * open. Closed it reads as another window bay; ajar it's a dark gap in
 * the run with the room's desk lamp leaking through. Unmistakable at
 * range — a doorway where there was glass — and the first gallery
 * anomaly you can walk into: the pocket between the desk rows is real.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const galleryDoor: AnomalyDef = {
  id: "gallery.door",
  displayName: "Gallery Door Ajar",
  chapter: 2,
  category: "object",
  detectability: "unmistakable",
  weight: 1,
  progressionRange: [30, 100],
  requires: ["wall.gallery.door"],
  // decals authored for the sealed glass would hang in the open gap
  excludes: ["face.glass", "glass.hands", "glass.writing", "depth.mismatch"],
  testSeed: "test.gallery.door",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, rng } = ctx;
    const leaf = ctx.world.registry.get("wall.gallery.door") as TransformNode;
    // slow creep open — you may catch it still moving on approach
    let t = 0;
    const pivot = leaf.getAbsolutePosition().clone();
    ctx.audio.playDoorSlide(pivot, true);
    // spilled case file — sheets trail from the corridor through the
    // open doorway into the room, someone left in a hurry
    const paperMat = new StandardMaterial("anomaly.gdoor.paper", scene);
    paperMat.diffuseColor = new Color3(0.72, 0.7, 0.64);
    paperMat.emissiveColor = new Color3(0.06, 0.055, 0.045);
    paperMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const spots: [number, number][] = [
      [1.35, 28.4],
      [1.58, 27.92],
      [1.86, 28.18],
      [2.12, 28.52],
      [2.38, 28.82],
      [2.28, 27.62],
      [2.6, 28.3],
    ];
    const sheets = spots.map(([px, pz], i) => {
      const s = CreateBox(`anomaly.gdoor.sheet.${i}`, { width: 0.16, height: 0.003, depth: 0.21 }, scene);
      s.material = paperMat;
      s.position = new Vector3(px, 0.008 + i * 0.0012, pz);
      s.rotation.y = rng.range(-0.9, 0.9);
      s.parent = ctx.world.root;
      return s;
    });
    return {
      update(dt: number) {
        if (t >= 1) return;
        t = Math.min(1, t + dt / 2.4);
        const e = 1 - (1 - t) * (1 - t) * (1 - t);
        leaf.rotation.y = e * 1.62; // ~93° — flat against the room's desks
      },
      cleanup() {
        leaf.rotation.y = 0;
        for (const s of sheets) s.dispose();
        paperMat.dispose();
      },
    };
  },
};
