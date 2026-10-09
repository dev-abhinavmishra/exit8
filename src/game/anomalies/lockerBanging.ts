/**
 * locker.banging — the staff door stands ajar and deep in the locker
 * room one locker door swings on its own, clanging shut over and
 * over. You hear it from the corridor before you see the open door.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

const LEAF_X = 1.65;
const LEAF_Z = 39.9;
const OPEN_TH = 0.55; // ajar, not swung
const BANG_PERIOD = 3.1; // seconds per swing cycle

export const lockerBanging: AnomalyDef = {
  id: "locker.banging",
  displayName: "A Locker Keeps Swinging",
  chapter: 2,
  category: "sound",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [22, 100],
  requires: ["staffroom.door.leaf"],
  excludes: ["corridor.mirror", "corridor.long", "staffroom.ajar", "staffroom.occupied"],
  testSeed: "test.locker.banging",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const leaf = world.registry.mesh("staffroom.door.leaf");
    leaf.rotation.y = OPEN_TH;
    leaf.position.x = LEAF_X + Math.sin(OPEN_TH) * 0.53;
    leaf.position.z = LEAF_Z - 0.53 + Math.cos(OPEN_TH) * 0.53;

    const glow = new PointLight("anomaly.staffroom.glow", new Vector3(2.6, 1.35, LEAF_Z), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.45);
    glow.intensity = 0.7;
    glow.range = 4.2;

    // the swinging locker door — third unit, hinged on its own edge
    const door = CreateBox("anomaly.locker.door", { width: 0.02, height: 1.86, depth: 0.3 }, scene);
    const dmat = new StandardMaterial("anomaly.locker.doorMat", scene);
    dmat.diffuseColor = new Color3(0.3, 0.3, 0.32);
    dmat.specularColor = new Color3(0.06, 0.06, 0.06);
    door.material = dmat;
    door.parent = world.root;
    // locker 3 face — hinge on the south edge of the door
    const HX = 3.93;
    const HZ = 39.74;
    let t = 0;
    let banged = false;
    let told = false;

    return {
      update(dt) {
        t += dt;
        if (!told) {
          told = true;
          ctx.audio.caption("something is banging in the walls", new Vector3(LEAF_X, 1.2, LEAF_Z));
        }
        const ph = (t % BANG_PERIOD) / BANG_PERIOD;
        // slow drift open for 80% of the cycle, snap shut on the last beat
        const open = ph < 0.8 ? ph / 0.8 : 0;
        const ang = open * 1.15;
        door.rotation.y = ang;
        door.position.set(HX + Math.sin(ang) * 0.15, 0.95, HZ + Math.cos(ang) * 0.15 - 0.15);
        if (ph >= 0.8 && !banged) {
          banged = true;
          door.rotation.y = 0;
          door.position.set(HX, 0.95, HZ - 0.15);
          ctx.audio.playKnock(new Vector3(HX, 1.0, HZ));
        } else if (ph < 0.8) {
          banged = false;
        }
      },
      cleanup() {
        leaf.rotation.y = 0;
        leaf.position.x = LEAF_X;
        leaf.position.z = LEAF_Z;
        glow.dispose();
        door.dispose();
        dmat.dispose();
      },
    };
  },
};
