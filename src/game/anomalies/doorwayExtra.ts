/**
 * doorway.extra — a lit service room appears behind a doorway on the east
 * wall at z≈37, where baseline is solid panels. Unmistakable: new
 * architecture + warm light spill into the corridor.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

const ROOM_Z = 37;
const DOOR_W = 1.1;

export const doorwayExtra: AnomalyDef = {
  id: "doorway.extra",
  displayName: "Unmapped Doorway",
  chapter: 1,
  category: "spatial",
  detectability: "unmistakable",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["wall.right.2a"],
  excludes: ["spatial.east"],
  testSeed: "test.doorway.extra",
  dangerous: false,
  activate(ctx) {
    const world = ctx.world;
    const scene = ctx.scene;
    const wallMesh = world.registry.mesh("wall.right.2a");
    const created: AbstractMesh[] = [];

    // Replace the solid wall segment with stub walls flanking the doorway,
    // then enable the prebuilt room beyond it.
    wallMesh.isVisible = false;
    const gaps: [number, number][] = [
      [32, ROOM_Z - DOOR_W / 2],
      [ROOM_Z + DOOR_W / 2, 55],
    ];
    for (const [a, b] of gaps) {
      const m = CreateBox(`anomaly.doorway.stub.${a}`, { width: 0.12, height: 3.0, depth: b - a }, scene);
      m.material = world.materials.wallPanel;
      m.position = new Vector3(1.8, 1.5, (a + b) / 2);
      m.parent = world.root;
      created.push(m);
    }
    const header = CreateBox(
      "anomaly.doorway.headerWall",
      { width: 0.12, height: 0.8, depth: DOOR_W },
      scene,
    );
    header.material = world.materials.wallPanel;
    header.position = new Vector3(1.8, 2.6, ROOM_Z);
    header.parent = world.root;
    created.push(header);

    // invisible barrier across the doorway mouth — the room is scenery,
    // not traversable space (prevents sequence breaks)
    const guard = CreateBox("anomaly.doorway.guard", { width: 0.1, height: 2.2, depth: DOOR_W }, scene);
    guard.isVisible = false;
    guard.checkCollisions = true;
    guard.position = new Vector3(1.82, 1.1, ROOM_Z);
    guard.parent = world.root;
    created.push(guard);

    world.extraRoom.setEnabled(true);
    world.extraRoomSpill.intensity = 4;

    return {
      update() {},
      cleanup() {
        world.extraRoom.setEnabled(false);
        world.extraRoomSpill.intensity = 0;
        wallMesh.isVisible = true;
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
