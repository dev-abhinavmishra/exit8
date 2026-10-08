/**
 * vend.dead — the cold-dispense unit on the right wall is always lit:
 * brand band glowing, product rows visible through the glass. Tonight it
 * is simply off — face dark, no hum. Reads at a distance as a black slab
 * where the corridor's only lit appliance used to be.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const vendDead: AnomalyDef = {
  id: "vend.dead",
  displayName: "Dead Vending Unit",
  chapter: 1,
  category: "object",
  detectability: "unmistakable",
  weight: 1.0,
  progressionRange: [0, 100],
  requires: ["prop.vending"],
  excludes: [],
  testSeed: "test.vend.dead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const unit = world.registry.get("prop.vending");
    const targets = unit
      .getChildMeshes()
      .filter((m) => m.name === "prop.vend.face" || m.name === "prop.vend.slot");
    targets.forEach((m) => m.setEnabled(false));
    // the compressor dies with the face — a dead machine doesn't hum
    ctx.audio.setVendGainScale(() => 0);
    return {
      update() {},
      cleanup() {
        targets.forEach((m) => m.setEnabled(true));
        ctx.audio.setVendGainScale(null);
      },
    };
  },
};
