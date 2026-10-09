/**
 * staffroom.occupied — the staff door stands open and someone is
 * inside the locker room, back to you at the lockers. Unmistakable.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";
import { buildFigure } from "../../world/figures";

const LEAF_X = 1.65;
const LEAF_Z = 39.9;
const OPEN_TH = 1.05;

export const staffroomOccupied: AnomalyDef = {
  id: "staffroom.occupied",
  displayName: "Someone Is Changing In There",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [34, 100],
  requires: ["staffroom.door.leaf"],
  excludes: ["corridor.mirror", "corridor.long", "staffroom.ajar", "locker.banging"],
  testSeed: "test.staffroom.occupied",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const leaf = world.registry.mesh("staffroom.door.leaf");
    leaf.rotation.y = OPEN_TH;
    leaf.position.x = LEAF_X + Math.sin(OPEN_TH) * 0.53;
    leaf.position.z = LEAF_Z - 0.53 + Math.cos(OPEN_TH) * 0.53;

    const glow = new PointLight("anomaly.staffroom.glow", new Vector3(2.6, 1.35, LEAF_Z), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.45);
    glow.intensity = 0.85;
    glow.range = 4.6;

    // a figure at the locker bank, back to the corridor — silhouetted
    // against the lit room through the open door
    const fig = buildFigure(scene, world.root, "anomaly.staffroom.fig", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    fig.root.position.set(2.1, 0, 39.55);
    fig.root.rotation.y = Math.PI / 2; // faces +x — into the room, away

    let told = false;
    return {
      update() {
        if (!told && Math.abs(ctx.player.position.z - LEAF_Z) < 4.5 && ctx.player.position.x > -0.2) {
          told = true;
          ctx.audio.caption("someone is changing in there", new Vector3(LEAF_X, 1.2, LEAF_Z));
        }
        glow.intensity = 0.5 + Math.sin((performance.now() / 1000) * 6.1) * 0.04;
      },
      cleanup() {
        leaf.rotation.y = 0;
        leaf.position.x = LEAF_X;
        leaf.position.z = LEAF_Z;
        glow.dispose();
        fig.root.dispose();
      },
    };
  },
};
