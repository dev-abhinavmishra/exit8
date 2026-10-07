/**
 * hall.stretch — the corridor is four metres longer than it was. The
 * south airlock has slid four metres back; the gap it left is dark,
 * unlit, and was always part of the route. The doors still open for
 * you — from four metres further away than they should be.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";
import * as kit from "../../world/generation/kit";
import { LAYOUT } from "../../world/generation/concourse";

const STRETCH = 4;

export const hallStretch: AnomalyDef = {
  id: "hall.stretch",
  displayName: "The Long Loop",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.55,
  progressionRange: [50, 100],
  requires: ["al.south.cap", "door.south.inner.L", "door.south.inner.R"],
  excludes: ["door.stuck", "door.slow", "figure.south", "sightline.impossible"],
  testSeed: "test.hall.stretch",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const al = scene.getTransformNodeByName("airlock.south");
    const endcap = scene.getMeshByName("endcap.55");
    if (!al) return { update() {}, cleanup() {} };

    al.position.z += STRETCH;
    if (endcap) endcap.position.z += STRETCH;
    // commit + door thresholds live in LAYOUT — shift them with the
    // airlock so logic follows the stretched geometry (restored on cleanup)
    const alz = LAYOUT.southAirlock as { z0: number; z1: number };
    const lay = LAYOUT as { commitSouthZ: number };
    alz.z0 += STRETCH;
    alz.z1 += STRETCH;
    lay.commitSouthZ += STRETCH;

    // fill the gap the airlock left: slab, ceiling, walls + colliders.
    // no troffers — the extension is unlit on purpose.
    const created: AbstractMesh[] = [];
    const addedColliders: AbstractMesh[] = [];
    const xH = LAYOUT.corridor.xHalf;
    const zC = 55 + STRETCH / 2;
    const floor = CreateBox("anomaly.stretch.floor", { width: xH * 2, height: 0.1, depth: STRETCH }, scene);
    floor.material = world.materials.concrete;
    floor.position = new Vector3(0, -0.05, zC);
    floor.parent = world.root;
    created.push(floor);
    const ceil = CreateBox("anomaly.stretch.ceil", { width: xH * 2, height: 0.1, depth: STRETCH }, scene);
    ceil.material = world.materials.ceiling;
    ceil.position = new Vector3(0, LAYOUT.corridor.height + 0.05, zC);
    ceil.parent = world.root;
    created.push(ceil);
    for (const sx of [-1, 1]) {
      const wall = CreateBox(
        `anomaly.stretch.wall.${sx}`,
        {
          width: 0.12,
          height: LAYOUT.corridor.height,
          depth: STRETCH,
        },
        scene,
      );
      wall.material = world.materials.wallPanel;
      wall.position = new Vector3(sx * xH, LAYOUT.corridor.height / 2, zC);
      wall.parent = world.root;
      created.push(wall);
      const col = kit.collider(
        `anomaly.stretch.wallCol.${sx}`,
        0.12,
        LAYOUT.corridor.height,
        STRETCH,
        wall.position.clone(),
        scene,
        world.root,
      );
      world.colliders.push(col);
      addedColliders.push(col);
    }

    return {
      update() {},
      cleanup() {
        al.position.z -= STRETCH;
        if (endcap) endcap.position.z -= STRETCH;
        alz.z0 -= STRETCH;
        alz.z1 -= STRETCH;
        lay.commitSouthZ -= STRETCH;
        for (const c of addedColliders) {
          const i = world.colliders.indexOf(c);
          if (i >= 0) world.colliders.splice(i, 1);
          c.dispose();
        }
        for (const m of created) m.dispose();
        created.length = 0;
        addedColliders.length = 0;
      },
    };
  },
};
