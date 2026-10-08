/**
 * gallery.occupied — someone is sitting at the reading-room desk
 * behind the observation glass. The desk that always carries the lit
 * monitor gains a dark seated figure facing the corridor, visible
 * through the smoked panes as a solid shape where the chair is always
 * empty. Unlike glass.eyes (a pacing emissive silhouette), this one
 * simply sits at the desk — closer to furniture than to a person,
 * which is what makes it wrong.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

export const galleryOccupied: AnomalyDef = {
  id: "gallery.occupied",
  displayName: "Someone in the Reading Room",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [40, 100],
  requires: ["wall.gallery.glass"],
  excludes: ["glass.eyes", "gallery.frost", "depth.mismatch"],
  testSeed: "test.gallery.occupied",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    // the monitor desk's chair: x = xHalf + 1.12, z = 26.5 + 0.3 —
    // sits deeper in the room than the glass, facing the corridor
    const bx = 2.92;
    const bz = 26.8;
    const parts: AbstractMesh[] = [];
    const add = (name: string, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
      m.material = world.materials.rubber;
      m.position = new Vector3(x, y, z);
      m.parent = world.root;
      parts.push(m);
      return m;
    };
    // seated at the chair, legs extending toward the desk (-x): hips
    // on the seat, torso up, thighs forward, shins down — the same
    // anatomy as the bench sitter, mirrored to face the corridor
    add("anomaly.occupied.torso", 0.2, 0.62, 0.32, bx, 0.78, bz);
    add("anomaly.occupied.shoulders", 0.22, 0.11, 0.42, bx, 1.06, bz);
    add("anomaly.occupied.thighs", 0.5, 0.14, 0.2, bx - 0.28, 0.5, bz);
    add("anomaly.occupied.shins", 0.12, 0.45, 0.18, bx - 0.48, 0.22, bz);
    add("anomaly.occupied.shoes", 0.24, 0.09, 0.14, bx - 0.48, 0.045, bz + 0.04);
    // forearms reaching forward onto the desk edge
    for (const sz of [-1, 1]) {
      add(`anomaly.occupied.arm.${sz}`, 0.09, 0.34, 0.1, bx - 0.05, 0.78, bz + sz * 0.17);
      add(`anomaly.occupied.hand.${sz}`, 0.16, 0.07, 0.09, bx - 0.32, 0.55, bz + sz * 0.16);
    }
    const skull = CreateSphere("anomaly.occupied.head", { diameter: 0.19, segments: 10 }, scene);
    skull.material = world.materials.rubber;
    skull.scaling = new Vector3(0.95, 1.35, 1);
    skull.position = new Vector3(bx, 1.24, bz);
    skull.parent = world.root;
    parts.push(skull);
    return {
      update() {},
      cleanup() {
        for (const p of parts) p.dispose();
        parts.length = 0;
      },
    };
  },
};
