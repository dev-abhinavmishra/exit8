/**
 * sheets.added — the notice board by the north end always carries
 * five typed memos. This loop a sixth sits among them, fresh and
 * slightly crooked. Subtle — a count the corridor taught you quietly
 * is now wrong by one.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const sheetsAdded: AnomalyDef = {
  id: "sheets.added",
  displayName: "A Sixth Memo",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [15, 100],
  requires: ["notice.board"],
  excludes: ["sheets.cleared", "notice.amends", "notice.gone"],
  testSeed: "test.sheets.added",
  dangerous: false,
  activate(ctx) {
    const { world } = ctx;
    const board = world.registry.get("notice.board");
    const src = board.getChildMeshes().filter((m) => m.name.startsWith("notice.sheet."))[0];
    const extra = src?.clone("notice.sheet.extra", board) ?? null;
    if (extra) {
      extra.position = new Vector3(-0.029, -0.16, 0.02);
      extra.rotation.y = Math.PI / 2;
      extra.rotation.z = -0.05;
    }
    return {
      update() {},
      cleanup() {
        extra?.dispose();
      },
    };
  },
};
