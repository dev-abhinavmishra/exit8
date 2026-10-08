/**
 * depth.mismatch — a service door on the east wall at z≈46 opens onto a
 * gallery that recedes ~12 metres into a wall that cannot hold it. The
 * corridor shows you somewhere too deep to exist. Unmistakable.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const ROOM_Z = 46;
const DOOR_W = 1.1;

export const depthMismatch: AnomalyDef = {
  id: "depth.mismatch",
  displayName: "The Wall Is Too Deep",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.55,
  progressionRange: [20, 100],
  requires: ["wall.right.2"],
  excludes: ["spatial.east"],
  testSeed: "test.depth.mismatch",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const world = ctx.world;
    const scene = ctx.scene;
    const wallMesh = world.registry.mesh("wall.right.2");
    const created: AbstractMesh[] = [];

    wallMesh.isVisible = false;
    const gaps: [number, number][] = [
      [32, ROOM_Z - DOOR_W / 2],
      [ROOM_Z + DOOR_W / 2, 55],
    ];
    for (const [a, b] of gaps) {
      const m = CreateBox(`anomaly.depth.stub.${a}`, { width: 0.12, height: 3.0, depth: b - a }, scene);
      m.material = world.materials.wallPanel;
      m.position = new Vector3(1.8, 1.5, (a + b) / 2);
      m.parent = world.root;
      created.push(m);
    }
    const header = CreateBox("anomaly.depth.headerWall", { width: 0.12, height: 0.8, depth: DOOR_W }, scene);
    header.material = world.materials.wallPanel;
    header.position = new Vector3(1.8, 2.6, ROOM_Z);
    header.parent = world.root;
    created.push(header);

    const guard = CreateBox("anomaly.depth.guard", { width: 0.1, height: 2.2, depth: DOOR_W }, scene);
    guard.isVisible = false;
    guard.checkCollisions = true;
    guard.position = new Vector3(1.82, 1.1, ROOM_Z);
    guard.parent = world.root;
    created.push(guard);

    world.depthRoom.setEnabled(true);
    world.depthSpill.intensity = 4;

    return {
      update() {
        // static swap — the room simply stays open and too deep
      },
      cleanup() {
        world.depthRoom.setEnabled(false);
        world.depthSpill.intensity = 0;
        wallMesh.isVisible = true;
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
