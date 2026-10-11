import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AbstractMesh } from "@babylonjs/core";
import { drawBoard, BOARD_BASE } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * board.dark — the departure board's feed is cut: both faces sit black
 * on the dead-glass rectangle while the rest of the corridor keeps its
 * light. Moderate — easy to skim past at walking height.
 */
export const boardDark: AnomalyDef = {
  id: "board.dark",
  displayName: "The Board Is Dead",
  chapter: 1,
  category: "lighting",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["board.face.n"],
  excludes: ["board", "board.gone", "board.notin", "board.flick"],
  testSeed: "test.board.dark",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const face = ctx.world.registry.get("board.face.n") as AbstractMesh;
    const tex = (face.material as StandardMaterial).diffuseTexture as DynamicTexture;
    drawBoard(tex, { ...BOARD_BASE, dead: true });
    return {
      update() {},
      cleanup() {
        drawBoard(tex, BOARD_BASE);
      },
    };
  },
};
