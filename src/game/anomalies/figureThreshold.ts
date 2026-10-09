/**
 * figure.threshold — a figure stands in the south mouth itself, facing
 * up the corridor — exactly where you have to walk to file. Its head
 * tracks you the whole way down. Push inside arm's reach and it steps
 * aside — makes room, never moves again. Dread, not damage: filing
 * means walking through where it stood.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildFigure, type Figure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const SPOT = new Vector3(0.15, 0, 52.5);
const ASIDE = 1.12;

export const figureThreshold: AnomalyDef = {
  id: "figure.threshold",
  displayName: "Standing in the Way",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [8, 100],
  requires: [],
  excludes: ["figure.corridor", "figure.wall", "lights.blackout", "walker.wait"],
  testSeed: "test.figure.threshold",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const fig: Figure = buildFigure(scene, world.root, "anomaly.figure.threshold", {
      kind: "silhouette",
    });
    fig.root.position.copyFrom(SPOT);
    fig.root.rotation.y = Math.PI; // faces north — up the corridor, at you

    let yielded = false;
    let yt = 0;
    let x0 = SPOT.x;
    return {
      update(dt) {
        const dx = ctx.player.position.x - fig.root.position.x;
        const dz = ctx.player.position.z - fig.root.position.z;
        // south-side facing (rotation.y = π) → the sign flip from the
        // lost-ending head-track
        fig.headPivot.rotation.y = Math.min(Math.max(Math.atan2(-dx, -dz), -1.3), 1.3);
        const d2 = dx * dx + dz * dz;
        if (!yielded && d2 < 2.1 * 2.1) {
          yielded = true;
          x0 = fig.root.position.x;
          ctx.audio.caption("it makes room", fig.root.getAbsolutePosition());
        }
        if (yielded && yt < 1) {
          yt = Math.min(1, yt + dt / 0.75);
          const e = yt * yt * (3 - 2 * yt);
          fig.root.position.x = x0 + (ASIDE - x0) * e;
        }
      },
      cleanup() {
        fig.root.dispose();
      },
    };
  },
};
