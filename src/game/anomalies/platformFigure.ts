import { buildFigure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * platform.figure — someone stands in the dark behind the bars: an
 * inspector-face silhouette at gate height. Despawns if you close on
 * it. Unmistakable / character.
 */
export const platformFigure: AnomalyDef = {
  id: "platform.figure",
  displayName: "Someone In The Gap",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [35, 100],
  requires: ["platform.void"],
  excludes: ["platform.train"],
  testSeed: "test.platform.figure",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const gate = ctx.world.registry.get("platform.gate");
    const fig = buildFigure(ctx.scene, gate, "anomaly.platform.fig", {
      kind: "silhouette",
      material: ctx.world.materials.rubber,
    });
    fig.root.position.set(-1.73, 0, 39.55);
    fig.root.rotation.y = Math.PI / 2;
    let gone = false;
    return {
      update() {
        if (gone) return;
        const d2 = ctx.player.position.subtract(fig.root.getAbsolutePosition()).lengthSquared();
        if (d2 < 1.35) {
          gone = true;
          fig.root.setEnabled(false);
        }
      },
      cleanup() {
        fig.root.dispose();
      },
    };
  },
};
