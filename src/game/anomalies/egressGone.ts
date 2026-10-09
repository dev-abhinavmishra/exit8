/**
 * egress.gone — the running-man strip is simply gone.
 * Ten photoluminescent boards run ankle-height along the west wall all
 * shift, pointing at the airlocks. Tonight every one of them is missing —
 * not swapped or mirrored, gone. You only catch it if you ever looked
 * down, which is the point.
 */
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

const BOARDS = [
  "dress.egress.0",
  "dress.egress.1",
  "dress.egress.2",
  "dress.egress.3",
  "dress.egress.4",
  "dress.egress.5",
  "dress.egress.6",
  "dress.egress.7",
  "dress.egress.8",
  "dress.egress.9",
];

export const egressGone: AnomalyDef = {
  id: "egress.gone",
  displayName: "Missing Egress Strip",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.7,
  progressionRange: [35, 100],
  requires: [
    "dress.egress.0",
    "dress.egress.1",
    "dress.egress.2",
    "dress.egress.3",
    "dress.egress.4",
    "dress.egress.5",
    "dress.egress.6",
    "dress.egress.7",
    "dress.egress.8",
    "dress.egress.9",
  ],
  excludes: ["egress.reversed"],
  testSeed: "test.egress.gone",
  dangerous: false,
  activate(ctx) {
    const hidden: AbstractMesh[] = [];
    for (const n of BOARDS) {
      const m = ctx.world.registry.get(n) as AbstractMesh | undefined;
      if (m) {
        m.setEnabled(false);
        hidden.push(m);
      }
    }
    return {
      update() {},
      cleanup() {
        for (const m of hidden) m.setEnabled(true);
      },
    };
  },
};
