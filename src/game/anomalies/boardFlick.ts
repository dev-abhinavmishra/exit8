import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AbstractMesh } from "@babylonjs/core";
import { drawBoard, BOARD_BASE } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const GLYPHS = "0123456789ABCDEXINOPRST -:";
function shuffle(line: string, r: () => number): string {
  return line
    .split("")
    .map((ch) => (ch !== " " && r() < 0.3 ? (GLYPHS[(r() * GLYPHS.length) | 0] ?? ch) : ch))
    .join("");
}

/**
 * board.flick — the split-flap never settles: both lines keep re-
 * shuffling glyphs all loop, a soft mechanical chatter overhead.
 * Unmistakable once you look up.
 */
export const boardFlick: AnomalyDef = {
  id: "board.flick",
  displayName: "It Keeps Re-Shuffling",
  chapter: 2,
  category: "object",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["board.face.n"],
  excludes: ["board", "board.dark", "board.notin"],
  testSeed: "test.board.flick",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const face = ctx.world.registry.get("board.face.n") as AbstractMesh;
    const tex = (face.material as StandardMaterial).diffuseTexture as DynamicTexture;
    let acc = 0;
    return {
      update(dt: number) {
        acc += dt;
        if (acc < 0.14) return;
        acc = 0;
        drawBoard(tex, {
          line1: shuffle(BOARD_BASE.line1, () => ctx.rng.draw()),
          line2: shuffle(BOARD_BASE.line2, () => ctx.rng.draw()),
        });
      },
      cleanup() {
        drawBoard(tex, BOARD_BASE);
      },
    };
  },
};
