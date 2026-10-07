/**
 * watcher.follows — a figure stands at the north end and gains ground
 * only while unobserved. Glance back and it freezes mid-corridor; walk
 * on and soft dragging steps close the distance behind you. Retreat
 * past it and it is simply gone — a step where it stood.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildFigure } from "../../world/figures";
import type { AnomalyDef } from "./types";

// stands inside the north airlock behind the spawn point — a glance
// back at loop start is the cold open, then it gains while unseen
const START = new Vector3(-0.25, 0, -3.4);
const GAIN_MS = 1.35; // metres/second while unseen
const LANE_MS = 0.3; // slides toward your lane, slower
const HALT_M = 2.4; // never closer than this
const VANISH_MIN_Z = 0.8; // only vanishes on retreat once inside the corridor

export const watcherFollows: AnomalyDef = {
  id: "watcher.follows",
  displayName: "It Gains When You Look Away",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [40, 100],
  requires: ["junction.machine"],
  excludes: ["figure"],
  testSeed: "test.watcher.follows",
  dangerous: false,
  activate(ctx) {
    const world = ctx.world;
    const scene = ctx.scene;
    // featureless silhouette on the shared humanoid rig — gains ground
    // only while unobserved, so it moves the whole root, not the parts
    const fig = buildFigure(scene, world.root, "anomaly.watcher.follows", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    const g = fig.root;
    g.rotation.y = 0; // it faces the direction it closes — toward you, +z

    let z = START.z;
    let x = START.x;
    let stepT = 0;
    let gone = false;

    const place = () => {
      g.position.x = x;
      g.position.z = z;
    };
    place();

    return {
      update(dt) {
        if (gone) return;
        const pp = ctx.player.position;
        // retreating past it inside the corridor — it yields like
        // watcher.far's figure: a step where it stood, then nothing
        if (z > VANISH_MIN_Z && pp.z < z - 0.5) {
          gone = true;
          g.setEnabled(false);
          ctx.audio.playFootstep(new Vector3(x, 0, z), 0.9, true);
          return;
        }
        // is it being looked at? player forward vs direction to figure
        const yaw = ctx.player.camera.rotation.y;
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        const dx = x - pp.x;
        const dz = z - pp.z;
        const dist = Math.hypot(dx, dz) || 1;
        const facing = (fx * dx + fz * dz) / dist;
        const observed = facing > 0.35; // ~69° cone — a glance back counts
        if (!observed && z < pp.z - HALT_M) {
          z = Math.min(z + GAIN_MS * dt, pp.z - HALT_M);
          x += Math.sign(pp.x - x) * Math.min(LANE_MS * dt, Math.abs(pp.x - x));
          place();
          stepT -= dt;
          if (stepT <= 0) {
            stepT = 0.85;
            ctx.audio.playFootstep(new Vector3(x, 0, z), 0.55, true);
          }
        }
      },
      cleanup() {
        g.dispose(false, true);
      },
    };
  },
};
