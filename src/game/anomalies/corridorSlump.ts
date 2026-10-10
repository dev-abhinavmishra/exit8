import { buildFigure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.slump — someone sits slumped against the east wall at z 22,
 * legs out, chin to chest. It does not move. Chapter III only.
 * Unmistakable / character.
 */
export const corridorSlump: AnomalyDef = {
  id: "corridor.slump",
  displayName: "Slumped Against The Wall",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.75,
  progressionRange: [35, 100],
  requires: ["svc.vent.1"],
  excludes: ["bench.sit", "figure.corridor", "pilaster.face"],
  testSeed: "test.corridor.slump",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const fig = buildFigure(ctx.scene, ctx.world.root, "anomaly.corridor.slump", {
      kind: "inspector",
      heightScale: 0.72,
    });
    fig.root.position.set(1.52, 0.02, 21.8);
    fig.root.rotation.y = Math.PI / 2 + 0.5;
    fig.root.rotation.z = 0.18;
    return {
      update() {},
      cleanup() {
        fig.root.dispose();
      },
    };
  },
};
