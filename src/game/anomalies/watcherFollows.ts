/**
 * watcher.follows — a figure stands at the north end and gains ground
 * only while unobserved. Glance back and it freezes mid-corridor; walk
 * on and soft dragging steps close the distance behind you. Retreat
 * past it and it is simply gone — a step where it stood.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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
    const g = new TransformNode("anomaly.watcher.follows", scene);
    g.parent = world.root;
    const body = CreateBox("anomaly.wf.body", { width: 0.5, height: 1.42, depth: 0.28 }, scene);
    body.material = world.materials.rubber;
    body.position = new Vector3(START.x, 0.86, START.z);
    body.parent = g;
    const shoulders = CreateBox("anomaly.wf.shoulders", { width: 0.64, height: 0.14, depth: 0.32 }, scene);
    shoulders.material = world.materials.rubber;
    shoulders.position = new Vector3(START.x, 1.55, START.z);
    shoulders.parent = g;
    const head = CreateBox("anomaly.wf.head", { width: 0.22, height: 0.32, depth: 0.24 }, scene);
    head.material = world.materials.rubber;
    head.position = new Vector3(START.x, 1.78, START.z);
    head.parent = g;

    let z = START.z;
    let x = START.x;
    let stepT = 0;
    let gone = false;

    const place = () => {
      for (const m of [body, shoulders, head]) {
        m.position.x = x;
        m.position.z = z;
      }
    };

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
