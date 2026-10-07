/**
 * vent.groan — the gallery vent exhales a slow pressure groan whenever you
 * pass within ~4 m of it. Moderate — a building breathing wrong.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const VENT = new Vector3(1.7, 2.9, 30); // vent.grille.1 anchor
const TRIGGER_M = 4;
const COOLDOWN_S = 9;

export const ventGroan: AnomalyDef = {
  id: "vent.groan",
  displayName: "Groaning Vent",
  chapter: 1,
  category: "sound",
  detectability: "moderate",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["vent.grille.1"],
  excludes: ["sound.vent"],
  testSeed: "test.vent.groan",
  dangerous: false,
  activate(ctx) {
    let cooldown = 0;
    let inside = false;
    return {
      update(dt) {
        cooldown = Math.max(0, cooldown - dt);
        const d = Vector3.Distance(ctx.player.position, VENT);
        const near = d < TRIGGER_M;
        if (near && !inside && cooldown === 0) {
          ctx.audio.playGroan(VENT);
          cooldown = COOLDOWN_S;
        }
        inside = near;
      },
      cleanup() {},
    };
  },
};
