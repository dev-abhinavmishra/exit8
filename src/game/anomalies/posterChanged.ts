/**
 * poster.changed — the REPORT DRIFT poster now reads different copy:
 * quieter, wronger, addressed to nobody. Subtle — seeded between two
 * alternate texts so repeat players can't memorize it.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { POSTER_DEFS, drawPoster, type PosterDef } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

const ALT: PosterDef[] = [
  {
    title: "REPORT NOTHING",
    sub: ["ALL CHANGES HAVE BEEN", "PRE-FILED BY THE ROUTE", "DO NOT DIAL 7-700"],
    bg: "#2a2024",
    fg: "#d8d5cd",
  },
  {
    title: "REPORT DRIFT",
    sub: ["UNLOGGED CHANGES ARE", "A ROUTE SAFETY ISSUE", "DIAL 7-700 EXTERNAL"],
    bg: "#2a2024",
    fg: "#d8d5cd",
  },
];

export const posterChanged: AnomalyDef = {
  id: "poster.changed",
  displayName: "Rewritten Poster",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["poster.2"],
  excludes: ["wall.left.poster", "signage.text"],
  testSeed: "test.poster.changed",
  dangerous: false,
  activate(ctx) {
    const p = ctx.world.registry.mesh("poster.2");
    const mat = p.material as { diffuseTexture?: DynamicTexture } | null;
    const t = mat?.diffuseTexture;
    const orig = POSTER_DEFS[2];
    if (!t || !orig) return { update() {}, cleanup() {} };
    drawPoster(t, ctx.rng.pick(ALT));
    return {
      update() {},
      cleanup() {
        drawPoster(t, orig);
      },
    };
  },
};
