/**
 * The other inspector — an ambient figure who walks the same loop the
 * player audits. He is BASELINE, not an anomaly: identical every loop,
 * always mid-corridor at spawn, always walking south then back. His
 * constancy is the point — it makes "the walker" a learnable part of
 * normal so any future behavior change reads as a divergence.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { MaterialSet } from "../materials/library";
import type { WorldRegistry } from "../registry";

const WALK_Z0 = 7;
const WALK_Z1 = 48;
const SPEED = 1.05;
const PAUSE_S = 5;
const HOME_Z = 16; // loop-rebaseline spot — always mid-corridor on loop 1

export type WalkerMode = "normal" | "backwards" | "stare" | "absent";

export interface AmbientWalker {
  update(dt: number): void;
  reset(): void;
  /** anomaly hook — 'backwards' flips facing vs travel, 'stare' halts
   *  mid-corridor facing the player's approach. reset() restores normal. */
  setMode(mode: WalkerMode): void;
}

export function buildAmbientWalker(
  scene: Scene,
  root: TransformNode,
  _mats: MaterialSet,
  registry: WorldRegistry,
): AmbientWalker {
  const g = new TransformNode("ambient.walker", scene);
  g.parent = root;
  registry.register("ambient.walker", g);

  // muted slate — clearly a person, clearly staff, clearly NOT the
  // near-black anomaly silhouettes
  const coat = new StandardMaterial("ambient.walker.coat", scene);
  coat.diffuseColor = new Color3(0.1, 0.11, 0.13);
  coat.specularColor = new Color3(0.02, 0.02, 0.02);
  const skin = new StandardMaterial("ambient.walker.head", scene);
  skin.diffuseColor = new Color3(0.4, 0.34, 0.3);
  skin.specularColor = new Color3(0.03, 0.03, 0.03);
  const band = new StandardMaterial("ambient.walker.band", scene);
  band.emissiveColor = new Color3(0.9, 0.68, 0.22).scale(0.55);
  band.disableLighting = true;

  const body = CreateBox("ambient.walker.body", { width: 0.46, height: 1.3, depth: 0.26 }, scene);
  body.material = coat;
  body.position = new Vector3(0, 0.98, 0);
  body.parent = g;
  const shoulders = CreateBox("ambient.walker.shoulders", { width: 0.58, height: 0.13, depth: 0.3 }, scene);
  shoulders.material = coat;
  shoulders.position = new Vector3(0, 1.6, 0);
  shoulders.parent = g;
  const head = CreateBox("ambient.walker.head", { width: 0.2, height: 0.28, depth: 0.22 }, scene);
  head.material = skin;
  head.position = new Vector3(0, 1.8, 0);
  head.parent = g;
  // hi-vis stripe — the Authority's inspectors wear one
  const stripe = CreateBox("ambient.walker.stripe", { width: 0.47, height: 0.09, depth: 0.27 }, scene);
  stripe.material = band;
  stripe.position = new Vector3(0, 1.28, 0);
  stripe.parent = g;

  // stepping legs + counter-swinging arms on hip/shoulder pivots —
  // the stride reads at 40 m where a static box reads as a pillar
  const legPivots: TransformNode[] = [];
  for (const sx of [-1, 1]) {
    const hip = new TransformNode(`ambient.walker.hip.${sx}`, scene);
    hip.parent = g;
    hip.position = new Vector3(sx * 0.12, 0.78, 0);
    const leg = CreateBox(`ambient.walker.leg.${sx}`, { width: 0.14, height: 0.72, depth: 0.16 }, scene);
    leg.material = coat;
    leg.position = new Vector3(0, -0.36, 0);
    leg.parent = hip;
    legPivots.push(hip);
  }
  const armPivots: TransformNode[] = [];
  for (const sx of [-1, 1]) {
    const sh = new TransformNode(`ambient.walker.arm.${sx}`, scene);
    sh.parent = g;
    sh.position = new Vector3(sx * 0.3, 1.58, 0);
    const arm = CreateBox(`ambient.walker.armMesh.${sx}`, { width: 0.09, height: 0.58, depth: 0.12 }, scene);
    arm.material = coat;
    arm.position = new Vector3(0, -0.29, 0);
    arm.parent = sh;
    armPivots.push(sh);
  }
  // the case file he carries — a pale clipboard at the end of the left arm
  const clip = CreateBox("ambient.walker.clip", { width: 0.2, height: 0.28, depth: 0.02 }, scene);
  clip.material = skin;
  clip.position = new Vector3(0.02, -0.62, 0.08);
  clip.parent = armPivots[0]!;

  let z = HOME_Z;
  let dir = 1; // walking south (+z) at loop start
  let pauseT = 0;
  let bobT = 0;
  let mode: WalkerMode = "normal";

  return {
    reset() {
      mode = "normal";
      z = HOME_Z;
      dir = 1;
      pauseT = 0;
      g.setEnabled(true);
      g.position.set(0.55, 0, z);
      g.rotation.y = dir > 0 ? 0 : Math.PI;
    },
    setMode(m: WalkerMode) {
      mode = m;
      if (m === "absent") {
        // he is simply not there this loop — the routine has a hole in it
        g.setEnabled(false);
        return;
      }
      g.setEnabled(true);
      if (m === "stare") {
        // stops where he is, squared up to face the player's approach
        pauseT = 0;
        g.rotation.y = Math.PI;
      }
    },
    update(dt) {
      bobT += dt;
      if (mode === "absent") return;
      if (mode === "stare") {
        // dead still except the slightest drift of the head
        g.position.set(0.55, 0, z);
        for (const p of [...legPivots, ...armPivots]) p.rotation.x = 0;
        return;
      }
      if (pauseT > 0) {
        pauseT -= dt;
      } else {
        z += dir * SPEED * dt;
        if (z >= WALK_Z1 && dir > 0) {
          z = WALK_Z1;
          dir = -1;
          pauseT = PAUSE_S;
        } else if (z <= WALK_Z0 && dir < 0) {
          z = WALK_Z0;
          dir = 1;
          pauseT = PAUSE_S;
        }
        // facing follows mode: normally the direction of travel;
        // 'backwards' keeps him squared away from it (the moonwalk)
        const facing = mode === "backwards" ? -dir : dir;
        g.rotation.y = facing > 0 ? 0 : Math.PI;
      }
      // stride bob — tiny, readable at distance
      const bob = Math.abs(Math.sin(bobT * 3.4)) * 0.028;
      g.position.set(0.55, bob, z);
      // limbs swing only while he's actually in stride
      const stepping = pauseT <= 0; // stare/absent returned above
      const swing = stepping ? Math.sin(bobT * 3.4) : 0;
      legPivots[0]!.rotation.x = swing * 0.5;
      legPivots[1]!.rotation.x = -swing * 0.5;
      armPivots[0]!.rotation.x = -swing * 0.32;
      armPivots[1]!.rotation.x = swing * 0.32;
    },
  };
}
