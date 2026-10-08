/**
 * walker.hum — the other inspector is whistling. He walks his normal
 * route with his normal stride — but a loose, slightly off-key tune
 * drifts out of him. In a corridor whose only voices are the PA and the
 * fans, a melody is unmistakably wrong; you hear it before you see him.
 *
 * Implementation: deterministic phrases from ctx.rng — 5-8 notes on a
 * minor-ish scale, each detuned a touch, note/gap timing varied. After
 * each phrase he rests a few seconds, then starts a new one.
 */
import type { AnomalyDef } from "./types";

// natural minor on A2 — a range a person would actually whistle in
const SCALE = [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0];

export const walkerHum: AnomalyDef = {
  id: "walker.hum",
  displayName: "He's Whistling",
  chapter: 2,
  category: "sound",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["ambient.walker"],
  // conflicts with every mode-changer — he must be walking his normal
  // route for the tune to read as his
  excludes: [
    "walker",
    "walker.absent",
    "walker.stare",
    "walker.backwards",
    "walker.crawl",
    "walker.midstep",
    "walker.wait",
    "walker.fast",
    "walker.charge",
    "walker.crowd",
    "figure",
  ],
  testSeed: "test.walker.hum",
  dangerous: false,
  activate(ctx) {
    const walkerNode = ctx.world.registry.mesh("ambient.walker");
    // phrase state: notes to play, seconds until the next note is due
    let notes: number[] = [];
    let durs: number[] = [];
    let gaps: number[] = [];
    let idx = 0;
    let wait = 0.5; // the tune starts almost as you enter
    const phrase = () => {
      const len = 5 + ctx.rng.int(0, 4);
      notes = [];
      durs = [];
      gaps = [];
      let deg = ctx.rng.int(0, SCALE.length);
      for (let i = 0; i < len; i++) {
        // wander the scale like an improvised tune — small steps mostly
        deg += ctx.rng.int(-2, 3);
        deg = Math.max(0, Math.min(SCALE.length - 1, deg));
        notes.push(SCALE[deg]! * (0.992 + ctx.rng.draw() * 0.016)); // a touch flat
        durs.push(0.3 + ctx.rng.draw() * 0.3);
        gaps.push(0.04 + ctx.rng.draw() * 0.16);
      }
      idx = 0;
    };
    phrase();
    return {
      update(dt) {
        wait -= dt;
        if (wait > 0) return;
        if (idx >= notes.length) {
          // phrase over — rest a few seconds, then a new tune
          wait = 4.5 + ctx.rng.draw() * 5;
          phrase();
          return;
        }
        const pos = walkerNode.getAbsolutePosition();
        pos.y += 0.35; // mouth, not feet
        ctx.audio.playWhistle(pos, notes[idx]!, durs[idx]!);
        if (idx === 0) ctx.audio.caption("whistling", pos);
        wait = durs[idx]! * 0.75 + gaps[idx]!;
        idx++;
      },
      cleanup() {
        // oscillators are one-shots; nothing to restore
      },
    };
  },
};
