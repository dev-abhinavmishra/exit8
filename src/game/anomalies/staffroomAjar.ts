/**
 * staffroom.ajar — the STAFF door stands open on the lit locker
 * room: locker bank, bench, hooks — a room that can be walked into.
 * Moderate once the doorway's in view.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";

const LEAF_X = 1.65;
const LEAF_Z = 39.9;
const OPEN_TH = 1.05;

export const staffroomAjar: AnomalyDef = {
  id: "staffroom.ajar",
  displayName: "The Staff Room Is Open",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [16, 100],
  requires: ["staffroom.door.leaf"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "staffroom.occupied", "locker.banging"],
  testSeed: "test.staffroom.ajar",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const leaf = world.registry.mesh("staffroom.door.leaf");
    leaf.rotation.y = OPEN_TH;
    leaf.position.x = LEAF_X + Math.sin(OPEN_TH) * 0.53;
    leaf.position.z = LEAF_Z - 0.53 + Math.cos(OPEN_TH) * 0.53;

    const glow = new PointLight("anomaly.staffroom.glow", new Vector3(2.6, 1.35, LEAF_Z), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.45);
    glow.intensity = 0.8;
    glow.range = 4.4;

    let told = false;
    return {
      update() {
        if (!told && Math.abs(ctx.player.position.z - LEAF_Z) < 4.5 && ctx.player.position.x > -0.2) {
          told = true;
          ctx.audio.caption("the staff room is open", new Vector3(LEAF_X, 1.2, LEAF_Z));
        }
      },
      cleanup() {
        leaf.rotation.y = 0;
        leaf.position.x = LEAF_X;
        leaf.position.z = LEAF_Z;
        glow.dispose();
      },
    };
  },
};
