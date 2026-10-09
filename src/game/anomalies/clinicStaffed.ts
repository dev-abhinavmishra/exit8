/**
 * clinic.staffed — the shuttered counter's blind rolls up by itself
 * and the wall behind it is a lit intake alcove that was never there:
 * a pale staff room with someone seated at the desk working, back to
 * the window. The wall is a partition, not a wall — the room cannot
 * exist. Unmistakable once seen, easy to walk past.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";

// the shutter's aperture in wall.left.2 — rebuilt as stubs + header + sill
const WIN_Z0 = 34.9;
const WIN_Z1 = 39.1;

export const clinicStaffed: AnomalyDef = {
  id: "clinic.staffed",
  displayName: "Someone Is Working Late",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [10, 100],
  requires: ["wall.left.2", "clinic.shutter"],
  excludes: ["shutter.ajar", "counter.worker", "depth.mismatch"],
  testSeed: "test.clinic.staffed",
  dangerous: false,
  activate(ctx) {
    const { scene, world } = ctx;
    const wallMesh = world.registry.mesh("wall.left.2");
    const shutter = world.registry.mesh("clinic.shutter");
    const created: AbstractMesh[] = [];
    wallMesh.isVisible = false;
    const add = (name: string, h: number, z0: number, z1: number, y: number) => {
      const m = CreateBox(name, { width: 0.12, height: h, depth: z1 - z0 }, scene);
      m.material = world.materials.wallPanel;
      m.position = new Vector3(-1.8, y, (z0 + z1) / 2);
      m.parent = world.root;
      created.push(m);
      return m;
    };
    add("anomaly.clinic.stub.0", 3.0, 32, WIN_Z0, 1.5);
    add("anomaly.clinic.stub.1", 3.0, WIN_Z1, 42, 1.5);
    add("anomaly.clinic.header", 0.6, WIN_Z0, WIN_Z1, 2.7);
    add("anomaly.clinic.sill", 1.1, WIN_Z0, WIN_Z1, 0.55);

    world.clinicAlcove.setEnabled(true);
    world.clinicLamp.intensity = 0.9;
    const skull = world.clinicAlcove.getChildMeshes().find((m) => m.name === "anomaly.clinic.head");

    const sY0 = shutter.position.y;
    let t = 0;
    ctx.audio.playDoorSlide(shutter.getAbsolutePosition(), true);
    return {
      update(dt) {
        t += dt;
        // the shutter rolls up: it shortens into the header line while
        // its bottom edge rises — slats coiling into a housing, not a
        // rigid slab sliding through the ceiling
        const p = Math.min(1, t / 1.8);
        const e = p * p * (3 - 2 * p);
        const s = 1 - e * 0.9;
        shutter.scaling.y = s;
        shutter.position.y = 2.42 - 0.65 * s;
        // the figure keeps working — a small writing nod, the only
        // moving thing in a room that should not exist
        if (skull) skull.rotation.x = Math.sin(t * 1.1) * 0.07;
      },
      cleanup() {
        world.clinicAlcove.setEnabled(false);
        world.clinicLamp.intensity = 0;
        wallMesh.isVisible = true;
        shutter.scaling.y = 1;
        shutter.position.y = sY0;
        for (const m of created) m.dispose();
        created.length = 0;
      },
    };
  },
};
