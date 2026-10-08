/**
 * terminal.advisory — a beat into the loop, both airlock terminals
 * print one row the paperwork never issues: an ADVISORY addressed to
 * whoever is reading. Otherwise the board is honest — which is worse.
 * Unmistakable.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { drawTerminal } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const terminalAdvisory: AnomalyDef = {
  id: "terminal.advisory",
  displayName: "Advisory Row",
  chapter: 2,
  category: "systemic",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["al.north.terminal"],
  excludes: ["terminal"],
  testSeed: "test.terminal.advisory",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const line = ctx.rng.pick(["LOOK BEHIND YOU", "COUNT AGAIN", "NOT YOUR LOOP"]);
    let t = 0;
    let done = false;
    return {
      update(dt) {
        if (done) return;
        t += dt;
        if (t < 1.4) return;
        done = true;
        drawTerminal(ctx.world.textures.terminal, {
          header: "ROUTE INTEGRITY",
          rows: [
            { label: "FILED", value: "NONE" },
            { label: "STABILITY", value: "40" },
            { label: "ADVISORY", value: line, tone: "bad" },
          ],
        });
        ctx.audio.caption("the terminal prints an advisory", new Vector3(0, 1.4, 55));
      },
      cleanup() {},
    };
  },
};
