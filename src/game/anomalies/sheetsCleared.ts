/**
 * sheets.cleared — the notice board by the north end is always pinned
 * with typed CWA memos. Tonight every sheet is gone: bare cork, pins and
 * all. A memorization check — the board itself is exactly where it was.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const sheetsCleared: AnomalyDef = {
  id: "sheets.cleared",
  displayName: "Stripped Notice Board",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["notice.board"],
  excludes: [],
  testSeed: "test.sheets.cleared",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const board = world.registry.get("notice.board");
    const sheets = board.getChildMeshes().filter((m) => m.name.startsWith("notice.sheet."));
    sheets.forEach((m) => m.setEnabled(false));
    return {
      update() {},
      cleanup() {
        sheets.forEach((m) => m.setEnabled(true));
      },
    };
  },
};
