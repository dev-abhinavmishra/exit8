/**
 * cabinet.rows — the whole records bank gapes. Every drawer mouth in
 * the eighteen-metre run stands open at a different depth, all dark.
 * Escalation of the single-drawer breach; unmistakable.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

const CABINET_FACE_X = -1.55;

export const cabinetRows: AnomalyDef = {
  id: "cabinet.rows",
  displayName: "All Drawers Open",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.6,
  progressionRange: [45, 100],
  requires: ["records.cabinets"],
  excludes: ["records.breach"],
  testSeed: "test.cabinet.rows",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];
    let i = 0;
    for (let z = 15; z <= 29; z += 2.3) {
      if (z > 21.3 && z < 23.0) continue; // archives doorway — no drawer here
      for (const y of [1.35, 1.8]) {
        const depth = rng.range(0.06, 0.22);
        const drawer = CreateBox(`anomaly.rows.d${i}`, { width: depth, height: 0.28, depth: 0.4 }, scene);
        drawer.material = world.materials.wallPanel;
        drawer.position = new Vector3(CABINET_FACE_X + depth / 2, y, z + rng.range(-0.1, 0.1));
        drawer.parent = world.root;
        created.push(drawer);
        const hollow = CreateBox(
          `anomaly.rows.h${i}`,
          { width: depth - 0.02, height: 0.22, depth: 0.34 },
          scene,
        );
        hollow.material = world.materials.rubber;
        hollow.position = new Vector3(CABINET_FACE_X + depth / 2 + 0.01, y, drawer.position.z);
        hollow.parent = world.root;
        created.push(hollow);
        i++;
      }
    }
    return {
      update() {},
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
