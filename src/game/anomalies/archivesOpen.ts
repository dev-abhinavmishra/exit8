/**
 * archives.open — the sealed ARCHIVES door stands open onto the stacks:
 * a lit interior that should not exist behind the card bank — shelf
 * runs, archive boxes, a desk lamp burning. The door never opens in
 * the baseline. Moderate: reads as a warm wedge in the bank face.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";

const OPEN_TH = 1.05; // rad the leaf stands open
const LEAF_X = -1.65;
const LEAF_Z = 22.1;

export const archivesOpen: AnomalyDef = {
  id: "archives.open",
  displayName: "The Archives Stand Open",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [16, 100],
  requires: ["archives.door.leaf"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "archives.staffed"],
  testSeed: "test.archives.open",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const leaf = world.registry.mesh("archives.door.leaf");
    // swing inward into the stacks on the north jamb; hinge pinned at z21.57
    leaf.rotation.y = -OPEN_TH;
    leaf.position.x = LEAF_X - Math.sin(OPEN_TH) * 0.53;
    leaf.position.z = LEAF_Z - 0.53 + Math.cos(OPEN_TH) * 0.53;
    const glow = new PointLight("anomaly.archives.glow", new Vector3(-2.6, 1.35, 22.1), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.45);
    glow.intensity = 0.85;
    glow.range = 4.6;
    let told = false;
    return {
      update() {
        if (!told && Math.abs(ctx.player.position.z - LEAF_Z) < 4 && ctx.player.position.x < 0) {
          told = true;
          ctx.audio.caption("the archives are open", new Vector3(LEAF_X, 1.2, LEAF_Z));
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
