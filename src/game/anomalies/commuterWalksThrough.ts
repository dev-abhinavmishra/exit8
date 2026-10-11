import type { AnomalyDef } from "./types";

/**
 * commuter.walks.through — the give-way is off: stand in his lane on
 * the way out and he keeps coming, stride even, eyes on the south
 * door — and passes through the space you're standing in.
 */
export const commuterWalksThrough: AnomalyDef = {
  id: "commuter.walks.through",
  displayName: "He Walks Through You",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.85,
  progressionRange: [45, 100],
  requires: ["commuter", "al.south.cap"],
  excludes: [
    "commuter.stays",
    "commuter.returns",
    "commuter.north",
    "commuter.fled",
    "commuter.midflee",
    "commuter.steps.linger",
    "commuter.steps.ahead",
    "commuter.steps.off",
    "commuter.waits.forever",
    "commuter.brushes.past",
    "commuter.waits.far",
    "commuter.detour",
  ],
  testSeed: "test.commuter.walks.through",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "seat");
    commuter.setDepart({ at: 12 });
    commuter.setGiveWay({ enabled: false });
    let said = false;
    return {
      update() {
        const p = commuter.root.position;
        const d2 = (p.x - ctx.player.position.x) ** 2 + (p.z - ctx.player.position.z) ** 2;
        if (!said && d2 < 0.6) {
          said = true;
          ctx.audio.caption("he walks through the space you're standing in", p);
        }
      },
      cleanup() {
        commuter.setGiveWay(null);
      },
    };
  },
};
