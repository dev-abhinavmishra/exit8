/**
 * map.wrong — the route map's YOU ARE HERE marker moved to a different
 * stop. The LOOP 7 schematic is otherwise identical — same stops, same
 * line, same footnote — but it claims you stand somewhere you are not.
 * A memorization trap: the map is the corridor's baseline anchor, so a
 * moved marker reads instantly to anyone who actually looks.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawRouteMap } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

export const mapWrong: AnomalyDef = {
  id: "map.wrong",
  displayName: "You Are Not Here",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["map.routemap"],
  excludes: ["sign.loop8", "arrow.points", "sign.mirror"],
  testSeed: "test.map.wrong",
  dangerous: false,
  activate(ctx) {
    const { world, rng } = ctx;
    const face = world.registry.mesh("map.routemap");
    const tex = (face.material as { diffuseTexture?: DynamicTexture }).diffuseTexture;
    // RECORDS WALL (1) or JUNCTION S-2 (2) — never INSPECTION POINT:
    // its marker row would spill past the map's heading arrow
    const hereStop = rng.pick([1, 2]);
    if (tex) drawRouteMap(tex, hereStop);
    return {
      update() {},
      cleanup() {
        if (tex) drawRouteMap(tex, 0);
      },
    };
  },
};
