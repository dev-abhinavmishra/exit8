/**
 * door.rattle — the sealed service door shakes once in its frame:
 * three quick thuds and the latch chattering, and the leaf visibly
 * judders for a beat. Something pushed from the other side.
 */
import type { AnomalyDef } from "./types";

export const doorRattle: AnomalyDef = {
  id: "door.rattle",
  displayName: "The Door Is Tested",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [10, 100],
  requires: ["service.door.leaf"],
  excludes: ["door.ajar", "door.lit", "hatch.knocks", "panel.open"],
  testSeed: "test.door.rattle",
  dangerous: false,
  activate(ctx) {
    const { scene, rng } = ctx;
    const leaf = scene.getMeshByName("service.door.leaf");
    if (!leaf) return { update() {}, cleanup() {} };
    const pos = leaf.getAbsolutePosition().clone();
    const delay = rng.range(5, 15);
    const x0 = leaf.position.x;
    let t = 0;
    let shook = false;
    let shake = 0;
    return {
      update(dt) {
        if (!shook && (t += dt) >= delay) {
          shook = true;
          ctx.audio.playRattle(pos);
          shake = 0.55;
        }
        if (shake > 0) {
          shake -= dt;
          // judder in the frame — a push against the latch side
          leaf.position.x = x0 + Math.sin(shake * 55) * 0.012 * Math.min(1, shake * 3);
          if (shake <= 0) leaf.position.x = x0;
        }
      },
      cleanup() {
        leaf.position.x = x0;
      },
    };
  },
};
