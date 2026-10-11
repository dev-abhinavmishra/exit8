import { Vector3 } from "@babylonjs/core";
import type { AnomalyDef } from "./types";

/**
 * ceil.fallen — the access panel is off its frame entirely, lying
 * flat on the corridor floor below like a dropped tile; the plenum
 * mouth gapes bare overhead.
 */
export const ceilFallen: AnomalyDef = {
  id: "ceil.fallen",
  displayName: "It Fell Overnight",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["ceil.panel", "ceil.void"],
  excludes: ["ceil.ajar", "ceil.open", "ceil.cord", "ceil.lit"],
  testSeed: "test.ceil.fallen",
  dangerous: false,
  activate(ctx) {
    const panel = ctx.scene.getTransformNodeByName("ceil.panel");
    if (!panel) return { update() {}, cleanup() {} };
    // ceil node sits at (0.35, 2.985, 28): drop the panel to the floor
    // a pace south and lay it flat with a slight skew — it fell, it
    // wasn't placed.
    panel.position = new Vector3(0.12, -2.955, 1.05);
    panel.rotation.x = 0.05;
    panel.rotation.y = 0.22;
    return {
      update() {},
      cleanup() {
        panel.position = new Vector3(0, -0.018, 0);
        panel.rotation.x = 0;
        panel.rotation.y = 0;
      },
    };
  },
};
