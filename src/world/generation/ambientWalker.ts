/**
 * The other inspector — an ambient figure who walks the same loop the
 * player audits. He is BASELINE, not an anomaly: identical every loop,
 * always mid-corridor at spawn, always walking south then back. His
 * constancy is the point — it makes "the walker" a learnable part of
 * normal so any future behavior change reads as a divergence.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { buildFigure } from "../figures";
import type { MaterialSet } from "../materials/library";
import type { WorldRegistry } from "../registry";

const WALK_Z0 = 7;
const WALK_Z1 = 48;
const SPEED = 1.05;
const PAUSE_S = 5;
const HOME_Z = 16; // loop-rebaseline spot — always mid-corridor on loop 1

export type WalkerMode = "normal" | "backwards" | "stare" | "absent" | "crawl" | "fast" | "charge";

export interface AmbientWalker {
  update(dt: number): void;
  reset(): void;
  /** anomaly hook — 'backwards' flips facing vs travel, 'stare' halts
   *  mid-corridor facing the player's approach. reset() restores normal. */
  setMode(mode: WalkerMode): void;
  /** 'charge' mode only — the driving anomaly feeds the player's z each
   *  frame; he sprints to within a step of it and holds there. */
  chargeAt(playerZ: number): void;
}

export function buildAmbientWalker(
  scene: Scene,
  root: TransformNode,
  _mats: MaterialSet,
  registry: WorldRegistry,
): AmbientWalker {
  // shared humanoid: shoes, trouser legs, tapered coat, collar + lapels,
  // hi-vis band, hands, sphere skull + hair + drawn face. Hip/arm pivots
  // keep the ".hip." / ".arm." names walker.crowd's clone filters for.
  const fig = buildFigure(scene, root, "ambient.walker", { kind: "inspector" });
  const g = fig.root;
  registry.register("ambient.walker", g);
  const legPivots = fig.hips;
  const armPivots = fig.arms;

  // the case file he carries — a pale clipboard at the end of the left arm
  const clipMat = new StandardMaterial("ambient.walker.clip", scene);
  clipMat.diffuseColor = new Color3(0.82, 0.79, 0.72);
  clipMat.specularColor = new Color3(0.02, 0.02, 0.02);
  const clip = CreateBox("ambient.walker.clip", { width: 0.2, height: 0.28, depth: 0.02 }, scene);
  clip.material = clipMat;
  clip.position = new Vector3(0.02, -0.68, 0.1);
  clip.parent = armPivots[0]!;

  let z = HOME_Z;
  let dir = 1; // walking south (+z) at loop start
  let pauseT = 0;
  let bobT = 0;
  let mode: WalkerMode = "normal";
  let chargeZ: number | null = null;

  return {
    reset() {
      mode = "normal";
      chargeZ = null;
      z = HOME_Z;
      dir = 1;
      pauseT = 0;
      g.setEnabled(true);
      g.position.set(0.55, 0, z);
      g.rotation.y = dir > 0 ? 0 : Math.PI;
    },
    chargeAt(playerZ: number) {
      chargeZ = playerZ;
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
      // crawl: route and cadence intact but nearly stationary — he
      // covers a fifth of the route with a slowed, heavy stride
      // fast: same route at nearly double pace — he breezes the loop
      // you know he takes a minute on, and the cadence reads urgent
      const pace = mode === "crawl" ? 0.18 : mode === "fast" ? 1.9 : 1;
      bobT += dt * (mode === "crawl" ? 0.35 : mode === "fast" ? 1.7 : 1);
      if (mode === "absent") return;
      if (mode === "stare") {
        // dead still except the slightest drift of the head
        g.position.set(0.55, 0, z);
        for (const p of [...legPivots, ...armPivots]) p.rotation.x = 0;
        return;
      }
      if (mode === "charge") {
        // the man you know runs at you — sprint along his lane until a
        // step behind the player, then hold there at your shoulder.
        // Driven per-frame by the anomaly through chargeAt().
        if (chargeZ === null) {
          g.position.set(0.55, 0, z);
          return;
        }
        const dz = chargeZ - z;
        const closing = Math.abs(dz) > 1.15;
        if (closing) {
          z += Math.sign(dz) * 3.4 * dt;
          bobT += dt * 2.6;
          g.rotation.y = dz > 0 ? 0 : Math.PI;
        }
        const bob = closing ? Math.abs(Math.sin(bobT * 3.4)) * 0.04 : 0;
        g.position.set(0.55, bob, z);
        const swing = closing ? Math.sin(bobT * 3.4) : 0;
        legPivots[0]!.rotation.x = swing * 0.62;
        legPivots[1]!.rotation.x = -swing * 0.62;
        armPivots[0]!.rotation.x = -swing * 0.4;
        armPivots[1]!.rotation.x = swing * 0.4;
        return;
      }
      if (pauseT > 0) {
        pauseT -= dt;
      } else {
        z += dir * SPEED * dt * pace;
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
