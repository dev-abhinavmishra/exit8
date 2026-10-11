import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AbstractMesh } from "@babylonjs/core";
import { drawBoard, BOARD_BASE } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * board.notin — the board still runs, but the lower line reads
 * NOT IN SERVICE where a departure should be. Subtle — you have to
 * actually read it.
 */
export const boardNotin: AnomalyDef = {
  id: "board.notin",
  displayName: "Not In Service",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1.0,
  progressionRange: [10, 100],
  requires: ["board.face.n"],
  excludes: ["board", "board.dark", "board.flick"],
  testSeed: "test.board.notin",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const face = ctx.world.registry.get("board.face.n") as AbstractMesh;
    const tex = (face.material as StandardMaterial).diffuseTexture as DynamicTexture;
    drawBoard(tex, { line1: "8  CIRCULAR SERVICE", line2: "NOT IN SERVICE" });
    return {
      update() {},
      cleanup() {
        drawBoard(tex, BOARD_BASE);
      },
    };
  },
};
