/**
 * sightline.impossible — the corridor ends early. A second airlock,
 * sealed and signed, walls the corridor across at z≈38 where loop after
 * loop it has always continued to the far end. It is solid while it
 * exists. Unmistakable.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const sightlineImpossible: AnomalyDef = {
  id: "sightline.impossible",
  displayName: "The Corridor Ends Early",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [20, 100],
  requires: ["sightline.facade"],
  excludes: ["spatial"],
  testSeed: "test.sightline.impossible",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    ctx.world.registry.get("sightline.facade").setEnabled(true);
    return {
      update() {
        // static swap — the facade just stands there, sealed
      },
      cleanup() {
        ctx.world.registry.get("sightline.facade").setEnabled(false);
      },
    };
  },
};
