/**
 * creature.tall — a thing stands mid-corridor that is not the
 * inspector: too tall, too thin, limbs segmented wrong, head too small.
 * It sways on its feet and its head snaps toward you once you get
 * close enough to matter. Unmistakable figure-class anomaly.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const creatureTall: AnomalyDef = {
  id: "creature.tall",
  displayName: "The Tall One",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["duct.grate.1"],
  excludes: ["figure", "walker", "corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.creature.tall",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, player } = ctx;
    const skinMat = new StandardMaterial("mat.creature.skin", scene);
    skinMat.diffuseColor = new Color3(0.11, 0.1, 0.1);
    skinMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const root = new TransformNode("anomaly.creature", scene);
    root.position = new Vector3(0.3, 0, 40.5);
    root.rotation.y = Math.PI; // faces north, the approach
    const mk = (
      n: string,
      w: number,
      h: number,
      d: number,
      parent: TransformNode,
      x: number,
      y: number,
      z: number,
    ) => {
      const b = CreateBox(n, { width: w, height: h, depth: d }, scene);
      b.material = skinMat;
      b.parent = parent;
      b.position.set(x, y, z);
      return b;
    };
    // legs — too long, a backward-suggesting mid joint
    for (const sx of [-1, 1]) {
      const hip = new TransformNode(`anomaly.creature.hip.${sx}`, scene);
      hip.parent = root;
      hip.position = new Vector3(sx * 0.11, 1.32, 0);
      mk(`anomaly.creature.leg.up.${sx}`, 0.1, 0.75, 0.11, hip, 0, -0.37, 0.01);
      mk(`anomaly.creature.leg.lo.${sx}`, 0.08, 0.62, 0.09, hip, 0, -1.0, -0.03);
      mk(`anomaly.creature.foot.${sx}`, 0.1, 0.06, 0.3, hip, 0, -1.29, 0.09);
    }
    // torso — a narrow ribcage, slightly hunched
    const torso = mk("anomaly.creature.torso", 0.34, 0.62, 0.16, root, 0, 1.62, -0.02);
    torso.rotation.x = 0.14;
    mk("anomaly.creature.pelvis", 0.26, 0.2, 0.15, root, 0, 1.3, 0);
    // arms — three reads of wrong: too long, elbow set high, thin
    const arms: TransformNode[] = [];
    for (const sx of [-1, 1]) {
      const arm = new TransformNode(`anomaly.creature.arm.${sx}`, scene);
      arm.parent = root;
      arm.position = new Vector3(sx * 0.27, 1.86, 0.0);
      arm.rotation.z = sx * 0.16;
      mk(`anomaly.creature.arm.up.${sx}`, 0.07, 0.55, 0.08, arm, 0, -0.28, 0);
      mk(`anomaly.creature.arm.lo.${sx}`, 0.055, 0.6, 0.065, arm, 0, -0.83, 0.01);
      mk(`anomaly.creature.hand.${sx}`, 0.06, 0.28, 0.06, arm, 0, -1.24, 0.02);
      arms.push(arm);
    }
    // head — small, on a neck too long
    mk("anomaly.creature.neck", 0.07, 0.18, 0.07, root, 0, 1.98, -0.06);
    const headPivot = new TransformNode("anomaly.creature.headPivot", scene);
    headPivot.parent = root;
    headPivot.position = new Vector3(0, 2.06, -0.06);
    const head = CreateSphere("anomaly.creature.head", { diameter: 0.2, segments: 8 }, scene);
    head.material = skinMat;
    head.parent = headPivot;
    head.position.y = 0.08;
    let t = 0;
    let groaned = false;
    return {
      update(dt: number) {
        t += dt;
        root.rotation.z = Math.sin(t * 0.7) * 0.018;
        const d = Vector3.Distance(player.position, root.position);
        if (d < 9.5) {
          // the head finds you — snap-track, not a slow turn
          const dx = player.position.x - root.position.x;
          const dz = player.position.z - root.position.z;
          headPivot.rotation.y = Math.atan2(dx, dz) - root.rotation.y;
          if (!groaned && d < 7.5) {
            groaned = true;
            ctx.audio.playGroan(new Vector3(root.position.x, 1.9, root.position.z));
          }
        }
      },
      cleanup() {
        root.dispose();
        skinMat.dispose();
      },
    };
  },
};
