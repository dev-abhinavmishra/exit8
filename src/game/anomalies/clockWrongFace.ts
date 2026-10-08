/**
 * clock.wrong-face — two numerals on the master clock trade places. The
 * hands keep correct time; only the dial lies. Subtle — seed picks which
 * pair swaps so repeat players can't memorize the tell.
 */
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { drawClockFace } from "../../world/generation/textures";
import type { AnomalyDef } from "./types";

const PAIRS: [number, number][] = [
  [3, 9],
  [4, 8],
  [6, 12],
  [2, 7],
  [5, 11],
];

export const clockWrongFace: AnomalyDef = {
  id: "clock.wrong-face",
  displayName: "Reordered Dial",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["clock.face"],
  excludes: ["clock", "signage.text"],
  testSeed: "test.clock.wrongface",
  dangerous: false,
  activate(ctx) {
    const face = ctx.world.registry.mesh("clock.face");
    const mat = face.material as { diffuseTexture?: DynamicTexture } | null;
    const t = mat?.diffuseTexture;
    if (!t) return { update() {}, cleanup() {} };
    const pair = ctx.rng.pick(PAIRS);
    const numerals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const ia = pair[0] - 1;
    const ib = pair[1] - 1;
    const tmp = numerals[ia]!;
    numerals[ia] = numerals[ib]!;
    numerals[ib] = tmp;
    drawClockFace(t, numerals);
    return {
      update() {},
      cleanup() {
        drawClockFace(t);
      },
    };
  },
};
