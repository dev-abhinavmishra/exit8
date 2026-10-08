/**
 * ceiling.weeps — a seam in the ceiling tile drips onto the walk line:
 * a thin fall of water, a plink on impact, and a dark wet circle on
 * the terrazzo that slowly outgrows the drip rate. Moderate — you
 * notice the sound first, then the spreading shine under your feet.
 */
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

const FALL_S = 0.32;

export const ceilingWeeps: AnomalyDef = {
  id: "ceiling.weeps",
  displayName: "The Ceiling Weeps",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [5, 100],
  requires: ["floor"],
  excludes: ["floor.flood", "tracks.wet"],
  testSeed: "test.ceiling.weeps",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];
    const spot = new Vector3(rng.range(-0.9, 0.9), 0, rng.range(18, 42));

    const wet = new StandardMaterial("anomaly.weep.wet", scene);
    wet.diffuseColor = new Color3(0.05, 0.055, 0.06);
    wet.specularColor = new Color3(0.9, 0.9, 0.95);
    wet.specularPower = 8;
    wet.alpha = 0.5;

    const drop = CreateCylinder(
      "anomaly.weep.drop",
      { height: 0.09, diameter: 0.012, tessellation: 8 },
      scene,
    );
    const dm = new StandardMaterial("anomaly.weep.water", scene);
    dm.diffuseColor = new Color3(0.35, 0.4, 0.45);
    dm.emissiveColor = new Color3(0.06, 0.07, 0.08);
    dm.alpha = 0.75;
    drop.material = dm;
    drop.parent = world.root;
    drop.setEnabled(false);
    created.push(drop);

    const stain = CreateDisc("anomaly.weep.stain", { radius: 0.2, tessellation: 24 }, scene);
    stain.material = wet;
    stain.position.set(spot.x, 2.94, spot.z);
    stain.rotation.x = Math.PI / 2; // faces down from the ceiling
    stain.parent = world.root;
    created.push(stain);

    const pool = CreateDisc("anomaly.weep.pool", { radius: 0.16, tessellation: 24 }, scene);
    pool.material = wet;
    pool.position.set(spot.x, 0.012, spot.z);
    pool.rotation.x = -Math.PI / 2; // faces up from the floor
    pool.scaling.setAll(0.3);
    pool.parent = world.root;
    created.push(pool);

    const impact = new Vector3(spot.x, 0.5, spot.z);
    let timer = rng.range(0.2, 1.4);
    let fall = -1; // <0 idle, else elapsed fall time
    let grown = 0.3;
    return {
      update(dt) {
        if (fall < 0) {
          timer -= dt;
          if (timer <= 0) {
            fall = 0;
            drop.setEnabled(true);
          }
          return;
        }
        fall += dt;
        const k = Math.min(1, fall / FALL_S);
        drop.position.set(spot.x, 2.9 - k * k * 2.88, spot.z);
        if (k >= 1) {
          fall = -1;
          drop.setEnabled(false);
          timer = rng.range(0.9, 1.9);
          grown = Math.min(1, grown + 0.045);
          pool.scaling.setAll(grown);
          ctx.audio.playDrip(impact);
        }
      },
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
        wet.dispose();
        dm.dispose();
      },
    };
  },
};
