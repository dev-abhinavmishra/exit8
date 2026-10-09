/**
 * gallery.door — the glazed staff door in the observation glass stands
 * open. Closed it reads as another window bay; ajar it's a dark gap in
 * the run with the room's desk lamp leaking through. Unmistakable at
 * range — a doorway where there was glass — and the first gallery
 * anomaly you can walk into: the pocket between the desk rows is real.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
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
    const leaf = ctx.world.registry.get("wall.gallery.door") as TransformNode;
    // slow creep open — you may catch it still moving on approach
    let t = 0;
    const pivot = leaf.getAbsolutePosition().clone();
    ctx.audio.playDoorSlide(pivot, true);
    return {
      update(dt: number) {
        if (t >= 1) return;
        t = Math.min(1, t + dt / 2.4);
        const e = 1 - (1 - t) * (1 - t) * (1 - t);
        leaf.rotation.y = e * 1.62; // ~93° — flat against the room's desks
      },
      cleanup() {
        leaf.rotation.y = 0;
      },
    };
  },
};
