/**
 * records.breach — one compartment of the records bank stands open.
 * A drawer mouth gapes proud of the cabinet face; inside is a flat
 * unlit dark that swallows the corridor's light. Subtle.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

const CABINET_FACE_X = -1.55; // records.cabinets front face

export const recordsBreach: AnomalyDef = {
  id: "records.breach",
  displayName: "Open Drawer",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["records.cabinets"],
  excludes: [],
  testSeed: "test.records.breach",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];
    const z = rng.range(15, 29); // within the cabinet bank's z 13–31
    const y = rng.range(1.0, 1.85);

    // drawer carcass proud of the face
    const drawer = CreateBox("anomaly.records.drawer", { width: 0.16, height: 0.3, depth: 0.42 }, scene);
    drawer.material = world.materials.wallPanel;
    drawer.position = new Vector3(CABINET_FACE_X + 0.07, y, z);
    drawer.parent = world.root;
    created.push(drawer);

    // the hollow inside it — unlit
    const hollow = CreateBox("anomaly.records.hollow", { width: 0.13, height: 0.24, depth: 0.36 }, scene);
    hollow.material = world.materials.rubber;
    hollow.position = new Vector3(CABINET_FACE_X + 0.09, y, z);
    hollow.parent = world.root;
    created.push(hollow);

    return {
      update() {},
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
