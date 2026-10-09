/**
 * corridor.long — the corridor is longer than it was. The whole world
 * root stretches ~12% along z around the mid-route pivot: doors recede,
 * the guide strip runs long, the count of floor seams is wrong. The
 * commit stripes stretch with the geometry; the judgment planes stay
 * fixed — the player's own position is carried with the stretch so the
 * loop still starts and commits inside the shifted airlocks.
 * Unmistakable once the far doors stop arriving on time.
 */
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef } from "./types";

const SCALE = 1.12;
const PIVOT = 27.5;

export const corridorLong: AnomalyDef = {
  id: "corridor.long",
  displayName: "A Longer Corridor",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [12, 100],
  requires: ["wall.left.0"],
  excludes: [
    "corridor.mirror",
    "corridor.narrow",
    "corridor.breathes",
    "depth.mismatch",
    "clinic.staffed",
    "service.stairwell",
  ],
  testSeed: "test.corridor.long",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const off = PIVOT * (1 - SCALE);
    world.root.scaling.z = SCALE;
    world.root.position.z = off;
    // positional audio anchors are absolute — stretch them onto the
    // fixtures they still point at
    const anchors = [
      world.anchors.clock,
      world.anchors.vend,
      ...world.anchors.troffers,
      ...world.anchors.vents,
      ...world.anchors.paHorns,
    ];
    for (const a of anchors) a.z = a.z * SCALE + off;
    // the zone PointLights are scene-level, not under the stretched
    // root — carry each pool onto its displaced fixture
    const lights = scene.lights.filter((l): l is PointLight => l instanceof PointLight);
    const savedZ = lights.map((l) => l.position.z);
    for (const l of lights) l.position.z = l.position.z * SCALE + off;
    // the spawn sat inside the stretched north airlock in world space —
    // without this, the player materializes past the door a step from
    // the filing plane
    const pp = ctx.player.position;
    pp.z = pp.z * SCALE + off;
    return {
      update() {},
      cleanup() {
        world.root.scaling.z = 1;
        world.root.position.z = 0;
        for (const a of anchors) a.z = (a.z - off) / SCALE;
        lights.forEach((l, i) => (l.position.z = savedZ[i]!));
        ctx.player.position.z = (ctx.player.position.z - off) / SCALE;
      },
    };
  },
};
