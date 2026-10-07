/**
 * terminal.glitch — a beat into the loop, both airlock terminals redraw
 * with last loop's judgment wrong: the route insists a divergence was
 * filed and stability reads 0. It corrects itself at the next transition
 * — the building's paperwork is lying, briefly. Subtle.
 */
import { drawTerminal } from "../../world/generation/textures";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const terminalGlitch: AnomalyDef = {
  id: "terminal.glitch",
  displayName: "Terminal Disagrees",
  chapter: 2,
  category: "systemic",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [0, 100],
  requires: ["al.north.terminal"],
  excludes: ["terminal"],
  testSeed: "test.terminal.glitch",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    let t = 0;
    let done = false;
    return {
      update(dt) {
        // draw AFTER the loop's own ROUTE INTEGRITY repaint wins the
        // texture — both terminals share it, so one rewrite is enough
        if (done) return;
        t += dt;
        if (t < 1.4) return;
        done = true;
        drawTerminal(ctx.world.textures.terminal, {
          header: "ROUTE INTEGRITY",
          rows: [
            { label: "FILED", value: "DIVERGENCE", tone: "bad" },
            { label: "STABILITY", value: "0" },
            { label: "LOOP", value: "——", tone: "warn" },
          ],
        });
      },
      cleanup() {
        // next legitimate updateTerminals call repaints — nothing to undo
      },
    };
  },
};
