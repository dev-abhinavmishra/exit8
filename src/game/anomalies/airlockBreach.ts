/**
 * airlock.breach — the steel cap sealing the north end is gone. Where a
 * blank wall closed the loop, the building now continues: a short unlit
 * throat of concrete that runs past the survey boundary and stops dead.
 * Unmistakable, and the reward for glancing back at spawn — the breach is
 * only visible from inside the north airlock facing away from the route.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Material } from "@babylonjs/core/Materials/material";
import { LAYOUT } from "../../world/generation/concourse";
import type { AnomalyDef } from "./types";

const CAP_Z = -5; // LAYOUT.northAirlock.z0
const THROAT_D = 3.6;
const END_Z = CAP_Z - THROAT_D;

export const airlockBreach: AnomalyDef = {
  id: "airlock.breach",
  displayName: "Open Bulkhead",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [30, 100],
  requires: ["al.north.cap"],
  excludes: ["watcher.follows"],
  testSeed: "test.airlock.breach",
  dangerous: false,
  activate(ctx) {
    const { world, scene } = ctx;
    const cap = world.registry.mesh("al.north.cap");
    const capCol = world.colliders.find((c) => c.name === "al.north.capCol");
    const w = LAYOUT.airlockWidth;
    const h = LAYOUT.corridor.height;
    const zc = CAP_Z - THROAT_D / 2;
    const created: AbstractMesh[] = [];

    cap.isVisible = false;
    if (capCol) capCol.checkCollisions = false;

    const put = (
      name: string,
      width: number,
      height: number,
      depth: number,
      mat: Material,
      x: number,
      y: number,
      z: number,
      collide = false,
    ): AbstractMesh => {
      const m = CreateBox(name, { width, height, depth }, scene);
      m.material = mat;
      m.position = new Vector3(x, y, z);
      m.parent = world.root;
      m.checkCollisions = collide;
      created.push(m);
      return m;
    };

    put("anomaly.breach.floor", w, 0.06, THROAT_D, world.materials.concrete, 0, -0.03, zc);
    put("anomaly.breach.ceil", w, 0.06, THROAT_D, world.materials.rubber, 0, h + 0.03, zc);
    for (const sx of [-1, 1]) {
      put(
        `anomaly.breach.wall.${sx}`,
        0.12,
        h,
        THROAT_D,
        world.materials.rubber,
        (sx * w) / 2,
        h / 2,
        zc,
        true,
      );
    }
    // dead end + a single distant point of light — the void needs one
    // punctuation mark or it reads as a texture hole
    put("anomaly.breach.end", w, h, 0.12, world.materials.rubber, 0, h / 2, END_Z, true);
    put("anomaly.breach.dot", 0.04, 0.04, 0.01, world.materials.terminal, 0.35, 1.7, END_Z + 0.07);

    let groaned = false;
    return {
      update() {
        const p = ctx.player.position;
        if (!groaned && p.z < CAP_Z + 0.8) {
          groaned = true;
          ctx.audio.playGroan(new Vector3(0, 1.5, END_Z));
        }
      },
      cleanup() {
        cap.isVisible = true;
        if (capCol) capCol.checkCollisions = true;
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
