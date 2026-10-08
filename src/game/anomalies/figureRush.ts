/**
 * figure.rush — the corridor's only dangerous verdict. A dark figure
 * stands mid-route squared on you like figure.corridor — but this one
 * does not vanish. Close within a few metres and it breaks into a dead
 * sprint straight at you. If it reaches you, it is simply gone again —
 * with a cost to the run. The right play is to file the divergence
 * before it arrives. The loop's first dangerous anomaly: the catalog's
 * consequence floor, capped so the scare can't end the run alone.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef, AnomalyInstance } from "./types";

const TRIGGER = 6.5; // metres — it wakes when you commit to approaching
const CONTACT = 0.85;
const SPEED = 4.6;
const PENALTY = 6;

export const figureRush: AnomalyDef = {
  id: "figure.rush",
  displayName: "It Comes At You",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.5,
  progressionRange: [55, 100],
  requires: ["wall.right.2"],
  excludes: ["figure", "watcher.follows", "walker.crowd"],
  testSeed: "test.figure.rush",
  dangerous: true,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const fig = buildFigure(scene, world.root, "anomaly.figure.rush", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const node = fig.root;
    const home = new Vector3(rng.range(-0.4, 0.4), 0, rng.range(30, 40));
    node.position.copyFrom(home);
    node.rotation.y = Math.PI; // squared north, waiting on your approach

    let woken = false;
    let gone = false;
    let bobT = 0;
    const step = new Vector3();
    return {
      update(dt) {
        if (gone) return;
        const p = ctx.player.position;
        const dx = p.x - node.position.x;
        const dz = p.z - node.position.z;
        const dist = Math.hypot(dx, dz);
        if (!woken) {
          if (dist < TRIGGER) {
            woken = true;
            ctx.audio.caption("it's coming", null);
          } else {
            return; // patient — squared on you, unmoving
          }
        }
        // committed to the sprint — straight at you, stride swinging
        if (dist < CONTACT) {
          gone = true;
          ctx.penalize?.(PENALTY);
          ctx.audio.playGroan(p.clone(), "a body through the air");
          ctx.audio.caption("it reached you — the route felt it", null);
          node.setEnabled(false);
          return;
        }
        bobT += dt * 2.2;
        step.set(dx / dist, 0, dz / dist).scaleInPlace(Math.min(SPEED * dt, dist - CONTACT * 0.5));
        node.position.addInPlace(step);
        node.rotation.y = Math.atan2(dx, dz);
        const swing = Math.sin(bobT * 3.4);
        for (const [i, leg] of fig.hips.entries()) leg.rotation.x = (i === 0 ? 1 : -1) * swing * 0.68;
        for (const [i, arm] of fig.arms.entries()) arm.rotation.x = (i === 0 ? -1 : 1) * swing * 0.42;
        node.position.y = Math.abs(Math.sin(bobT * 3.4)) * 0.045;
      },
      cleanup() {
        node.dispose(false, true);
      },
    };
  },
};
