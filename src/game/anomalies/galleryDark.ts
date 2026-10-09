/**
 * gallery.dark — the reading room behind the smoked glass always keeps
 * a cove line, a monitor face and a desk lamp burning — the occupied
 * space you check without thinking about it. Tonight the room is
 * unlit: desks and cabinets still there, nothing answering the glass.
 * Reverse of gallery.lit.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const galleryDark: AnomalyDef = {
  id: "gallery.dark",
  displayName: "Gallery Unlit",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["wall.gallery.cove", "wall.gallery.monitor", "wall.gallery.lamp"],
  excludes: ["gallery.occupied", "gallery.lit", "gallery.frost"],
  testSeed: "test.gallery.dark",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const lamps = [
      world.registry.mesh("wall.gallery.cove"),
      world.registry.mesh("wall.gallery.monitor"),
      world.registry.mesh("wall.gallery.lamp"),
    ];
    // capture per-mesh materials — the monitor carries mats.terminal, so
    // a blanket trofferLit restore would kill its live text for good
    const restore = lamps.map((m) => m.material ?? null);
    lamps.forEach((m) => (m.material = world.materials.trofferDim));
    // the room's own PointLight is scene-level — dim it or the dead
    // gallery keeps glowing
    const gz = world.zones.find((z) => z.name === "gallery");
    const extras = gz ? gz.extraLights.map((l) => l.intensity) : [];
    if (gz) for (const l of gz.extraLights) l.intensity = 0;
    return {
      update() {},
      cleanup() {
        lamps.forEach((m, i) => (m.material = restore[i] ?? null));
        if (gz) gz.extraLights.forEach((l, i) => (l.intensity = extras[i] ?? l.intensity));
      },
    };
  },
};
