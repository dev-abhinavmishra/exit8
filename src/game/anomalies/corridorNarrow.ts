/**
 * corridor.narrow — the corridor is narrower than it was. The whole
 * world root pinches ~15% along x around the centre line: the walls
 * close in, the door mouths shrink, the ceiling tee-bars crowd. The
 * passage should be the same every loop — it isn't. Unmistakable
 * once your shoulders remember the width.
 */
import type { AnomalyDef } from "./types";

const SCALE = 0.85;

export const corridorNarrow: AnomalyDef = {
  id: "corridor.narrow",
  displayName: "A Narrower Corridor",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [30, 100],
  requires: ["wall.left.0"],
  excludes: [
    "corridor.mirror",
    "corridor.long",
    "corridor.breathes",
    "depth.mismatch",
    "archives.open",
    "archives.staffed",
    "archives.slam",
    "staffroom.ajar",
    "staffroom.occupied",
    "locker.banging",
    "service.stairwell",
    "clinic.staffed",
  ],
  testSeed: "test.corridor.narrow",
  dangerous: false,
  activate(ctx) {
    const { world } = ctx;
    world.root.scaling.x = SCALE;
    // positional audio anchors are absolute — pull them onto the
    // fixtures they still point at (wall-mounted horns/vents move in)
    const anchors = [
      world.anchors.clock,
      world.anchors.vend,
      ...world.anchors.troffers,
      ...world.anchors.vents,
      ...world.anchors.paHorns,
    ];
    for (const a of anchors) a.x = a.x * SCALE;
    return {
      update() {},
      cleanup() {
        world.root.scaling.x = 1;
        for (const a of anchors) a.x = a.x / SCALE;
      },
    };
  },
};
