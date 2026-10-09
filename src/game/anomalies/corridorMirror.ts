/**
 * corridor.mirror — the whole loop is flipped east-for-west: the
 * records bank, the gallery glass, the clinic counter — every fixture
 * sits on the wrong side and every sign reads backwards. Geometry
 * mirrors by scaling the world root; materials flip winding so the
 * corridor still renders face-out (sign textures mirror with the
 * geometry, which is the point). Unmistakable — if you ever look up.
 */
import type { Material } from "@babylonjs/core/Materials/material";
import type { AnomalyDef } from "./types";

export const corridorMirror: AnomalyDef = {
  id: "corridor.mirror",
  displayName: "The Wrong Side",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [10, 100],
  requires: ["wall.left.0"],
  excludes: ["sign.mirror", "walker.offlane", "depth.mismatch", "clinic.staffed"],
  testSeed: "test.corridor.mirror",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    world.root.scaling.x = -1;
    // mirroring inverts face winding — flip every material's side so
    // the corridor still renders out
    const mats: [Material, number][] = [];
    for (const m of scene.materials) {
      const o = m.sideOrientation ?? 1;
      mats.push([m, o]);
      m.sideOrientation = 1 - o;
    }
    // positional audio anchors are absolute — swing them to the side
    // the sound's source now lives on
    const singles = [world.anchors.clock, world.anchors.vend];
    const lists = [world.anchors.troffers, world.anchors.vents, world.anchors.paHorns];
    for (const a of singles) a.x = -a.x;
    for (const list of lists) for (const p of list) p.x = -p.x;
    return {
      update() {},
      cleanup() {
        world.root.scaling.x = 1;
        for (const [m, o] of mats) m.sideOrientation = o;
        for (const a of singles) a.x = -a.x;
        for (const list of lists) for (const p of list) p.x = -p.x;
      },
    };
  },
};
