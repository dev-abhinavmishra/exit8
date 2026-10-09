/**
 * gauntlet.watch — the corridor is queued: dark figures stand along
 * both walls at intervals, every one facing the wall, so you walk a
 * gauntlet of turned backs. Cross the midpoint and they all turn to
 * face the corridor at once — then their heads track you the rest of
 * the way. Unmistakable, dread not damage.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildFigure, type Figure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const TURN_Z = 28;

export const gauntletWatch: AnomalyDef = {
  id: "gauntlet.watch",
  displayName: "The Queue",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [12, 100],
  requires: [],
  excludes: ["figure.corridor", "figure.threshold", "lights.blackout", "walker.crowd"],
  testSeed: "test.gauntlet.watch",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const figs: Figure[] = [];
    const east: boolean[] = [];
    // ten figures alternating walls, z 7→52, all facing the wall —
    // a queue with nothing at the front of it
    for (let i = 0; i < 10; i++) {
      const side = i % 2 === 0 ? 1 : -1; // east, west, east…
      const z = 7 + i * 4.8 + rng.range(-0.6, 0.6);
      const f = buildFigure(scene, world.root, `anomaly.gauntlet.${i}`, {
        kind: "silhouette",
        heightScale: rng.range(0.94, 1.05),
      });
      f.root.position.set(side * 1.48, 0, z);
      f.root.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2; // faces the wall
      figs.push(f);
      east.push(side === 1);
    }

    let turned = false;
    let groan = false;
    return {
      update() {
        const p = ctx.player.position;
        if (!turned && Math.abs(p.z - TURN_Z) < 1.6) {
          turned = true;
          // they all face the corridor at once
          figs.forEach((f, i) => {
            f.root.rotation.y = east[i] ? -Math.PI / 2 : Math.PI / 2;
          });
          ctx.audio.playGroan(new Vector3(0, 1.6, TURN_Z));
          ctx.audio.caption("they are watching now", null);
          groan = true;
        }
        if (turned) {
          // heads track — the bodies never move again
          for (const f of figs) {
            const dx = p.x - f.root.position.x;
            const dz = p.z - f.root.position.z;
            const s = f.root.position.x > 0 ? -1 : 1; // east faces -x, west +x
            f.headPivot.rotation.y = Math.min(Math.max(Math.atan2(s * dx, s * dz), -1.3), 1.3);
          }
        }
      },
      cleanup() {
        for (const f of figs) f.root.dispose();
        void groan;
      },
    };
  },
};
