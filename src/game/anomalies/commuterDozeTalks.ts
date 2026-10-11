import type { AnomalyDef } from "./types";

/**
 * commuter.doze.talks — asleep on the bench, and murmuring: a low
 * unintelligible talk every few seconds, a small jerk of the head on
 * each phrase, as if a conversation carried on without him.
 */
export const commuterDozeTalks: AnomalyDef = {
  id: "commuter.doze.talks",
  displayName: "Talking In His Sleep",
  chapter: 2,
  category: "character",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 80],
  requires: ["commuter"],
  excludes: [],
  testSeed: "test.commuter.doze.talks",
  dangerous: false,
  activate(ctx) {
    const commuter = ctx.world.commuter;
    commuter.reset(true, "doze");
    let t = 6;
    let jerkT = 0;
    const lines = [
      "he murmurs — words that don't arrive",
      "a low phrase, and his head twitches with it",
      "the murmur again — same cadence, same nowhere",
    ];
    let li = 0;
    return {
      update(dt: number) {
        t += dt;
        if (jerkT > 0) {
          jerkT -= dt;
          commuter.fig.headPivot.rotation.z = 0.06 + Math.sin(jerkT * 20) * 0.05 * jerkT;
        }
        if (t > 8.5) {
          t = 0;
          jerkT = 0.6;
          ctx.audio.caption(li === 0 ? "he is talking in his sleep" : lines[li - 1]!, commuter.root.position);
          li = (li + 1) % (lines.length + 1);
        }
      },
      cleanup() {},
    };
  },
};
