/**
 * archives.staffed — the archives door stands open on the lit stacks
 * and someone is working at the desk inside, back to the corridor.
 * Unmistakable once the door's in view.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";
import { buildFigure } from "../../world/figures";

const OPEN_TH = 1.05;
const LEAF_X = -1.65;
const LEAF_Z = 22.1;

export const archivesStaffed: AnomalyDef = {
  id: "archives.staffed",
  displayName: "Someone Is Working the Stacks",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [34, 100],
  requires: ["archives.door.leaf"],
  excludes: [
    "corridor.mirror",
    "corridor.long",
    "corridor.narrow",
    "archives.open",
    "service.stairwell",
    "clinic.staffed",
  ],
  testSeed: "test.archives.staffed",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const leaf = world.registry.mesh("archives.door.leaf");
    leaf.rotation.y = -OPEN_TH;
    leaf.position.x = LEAF_X - Math.sin(OPEN_TH) * 0.53;
    leaf.position.z = LEAF_Z - 0.53 + Math.cos(OPEN_TH) * 0.53;
    const glow = new PointLight("anomaly.archives.glow", new Vector3(-2.6, 1.35, 22.1), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.45);
    glow.intensity = 0.85;
    glow.range = 4.6;
    // a clerk just inside the mouth, back to the corridor — silhouetted
    // against the lit stacks through the door gap
    const fig = buildFigure(scene, world.root, "anomaly.archives.fig", {
      kind: "silhouette",
      material: world.materials.rubber,
    });
    fig.root.position.set(-2.0, 0, 22.38);
    fig.root.rotation.y = -Math.PI / 2;
    let told = false;
    return {
      update(dt) {
        if (!told && Math.abs(ctx.player.position.z - LEAF_Z) < 4.5 && ctx.player.position.x < 0.2) {
          told = true;
          ctx.audio.caption("someone is working in there", new Vector3(LEAF_X, 1.2, LEAF_Z));
        }
        // the desk lamp breathes faintly — the room is lit by something
        // that flickers with the corridor's feed
        glow.intensity = 0.5 + Math.sin((performance.now() / 1000) * 7.3) * 0.04 * Math.min(1, dt * 60);
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
