/**
 * commuter.uniform — tonight he is one of them. The civilian sits on
 * his bench, reads his paper, keeps his habits — in the Authority kit:
 * hi-vis band, peaked cap, ID card. The corridor's most human fixture
 * wearing the wrong uniform. Moderate — easy to walk past, wrong once
 * learned.
 */
import type { AnomalyDef } from "./types";

export const commuterUniform: AnomalyDef = {
  id: "commuter.uniform",
  displayName: "One Of Them Tonight",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["commuter"],
  excludes: ["commuter.fled", "commuter.twin"],
  testSeed: "test.commuter.uniform",
  dangerous: false,
  activate(ctx) {
    const kit = ctx.world.commuter.root
      .getChildMeshes()
      .filter((m) => m.name.includes(".stripe") || m.name.includes(".cap.") || m.name.includes(".idcard"));
    for (const m of kit) m.setEnabled(true);
    return {
      update() {},
      cleanup() {
        for (const m of kit) m.setEnabled(false);
      },
    };
  },
};
