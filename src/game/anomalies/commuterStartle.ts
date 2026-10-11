import type { AnomalyDef } from "./types";

/**
 * commuter.startle — he dozes like always… until you come within arm's
 * reach, and then he snaps awake: head up, eyes on you, and he does
 * NOT go back to sleep — he watches you the rest of the route.
 */
export const commuterStartle: AnomalyDef = {
  id: "commuter.startle",
  displayName: "Snapped Awake",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["commuter"],
  excludes: ["commuter.follows"],
  testSeed: "test.commuter.startle",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "doze");
    let woken = false;
    return {
      update(_dt: number) {
        if (woken) {
          // hold the stare — the lock keeps baseline poses off him
          const p = commuter.root.position;
          const pp = ctx.player.position;
          commuter.fig.headPivot.rotation.x = 0.1;
          commuter.fig.headPivot.rotation.y = Math.max(
            -0.6,
            Math.min(0.6, Math.atan2(pp.x - p.x, pp.z - p.z) - (Math.PI / 2 - 0.15)),
          );
          return;
        }
        const dx = ctx.player.position.x - commuter.root.position.x;
        const dz = ctx.player.position.z - commuter.root.position.z;
        if (dx * dx + dz * dz < 4.8) {
          woken = true;
          commuter.setDozePoseLock(true);
          commuter.fig.headPivot.rotation.x = 0.1;
          commuter.fig.arms[0]!.rotation.x = -0.5;
          commuter.fig.arms[1]!.rotation.x = -0.55;
          ctx.audio.caption("he snapped awake — and he is watching you", null);
        }
      },
      cleanup() {
        commuter.setDozePoseLock(false);
      },
    };
  },
};
