/**
 * The other inspector — an ambient figure who walks the same loop the
 * player audits. He is BASELINE, not an anomaly: identical every loop,
 * always mid-corridor at spawn, always walking south then back. His
 * constancy is the point — it makes "the walker" a learnable part of
 * normal so any future behavior change reads as a divergence.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { buildFigure } from "../figures";
import type { MaterialSet } from "../materials/library";
import type { WorldRegistry } from "../registry";

const WALK_Z0 = 7;
const WALK_Z1 = 48;
const LANE_X = 0.55; // his lane — right-of-centre, drilled into you every loop
const SPEED = 1.05;
const PAUSE_S = 5;
const HOME_Z = 16; // loop-rebaseline spot — always mid-corridor on loop 1

export type WalkerMode =
  "normal" | "backwards" | "stare" | "absent" | "crawl" | "fast" | "charge" | "midstep" | "offlane";

export interface AmbientWalker {
  update(dt: number): void;
  reset(): void;
  /** anomaly hook — 'backwards' flips facing vs travel, 'stare' halts
   *  mid-corridor facing the player's approach. reset() restores normal. */
  setMode(mode: WalkerMode): void;
  /** 'charge' mode only — the driving anomaly feeds the player's z each
   *  frame; he sprints to within a step of it and holds there. */
  chargeAt(playerZ: number): void;
  /** move his hold point to z and freeze him there facing north —
   *  walker.wait stations him at the south mouth this way. */
  holdAt(z: number): void;
  /** wired by the app to audio — fires on each stride landing while
   *  he is actually walking. Not anomalous footsteps: his cadence is
   *  baseline, so a changed cadence stays anomalous. */
  onStep?: (pos: Vector3) => void;
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

  // the case file he carries — a real clipboard: dark board, clip band,
  // a typed audit sheet with a red finding mark
  const clipMat = new StandardMaterial("ambient.walker.clip", scene);
  clipMat.diffuseColor = new Color3(0.16, 0.13, 0.1);
  clipMat.specularColor = new Color3(0.03, 0.03, 0.03);
  const clip = CreateBox("ambient.walker.clip", { width: 0.2, height: 0.28, depth: 0.018 }, scene);
  clip.material = clipMat;
  clip.position = new Vector3(0.02, -0.68, 0.1);
  clip.parent = armPivots[0]!;
  const clipTex = new DynamicTexture("ambient.walker.clip.tex", { width: 128, height: 180 }, scene, true);
  const cc = clipTex.getContext() as unknown as CanvasRenderingContext2D;
  cc.fillStyle = "#e8e3d4";
  cc.fillRect(8, 10, 112, 166); // sheet
  cc.fillStyle = "#8f8c82"; // metal clip band
  cc.fillRect(8, 10, 112, 16);
  cc.fillStyle = "#3c382f";
  cc.fillRect(52, 6, 24, 10); // clip tab
  cc.strokeStyle = "#4c463b";
  cc.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = 40 + i * 14;
    cc.beginPath();
    cc.moveTo(16, y);
    cc.lineTo(16 + 84 - (i % 3) * 16, y);
    cc.stroke();
  }
  cc.strokeStyle = "#8c2f24";
  cc.lineWidth = 4;
  cc.strokeRect(78, 132, 34, 30); // red finding box
  cc.beginPath();
  cc.moveTo(84, 148);
  cc.lineTo(92, 156);
  cc.lineTo(106, 136);
  cc.stroke(); // check mark
  clipTex.update();
  const clipFaceMat = new StandardMaterial("ambient.walker.clip.face", scene);
  clipFaceMat.diffuseTexture = clipTex;
  clipFaceMat.specularColor = new Color3(0.03, 0.03, 0.03);
  const clipFace = CreatePlane("ambient.walker.clip.page", { width: 0.19, height: 0.27 }, scene);
  clipFace.material = clipFaceMat;
  clipFace.position = new Vector3(0.02, -0.68, 0.111);
  clipFace.parent = armPivots[0]!;

  let z = HOME_Z;
  let dir = 1; // walking south (+z) at loop start
  let pauseT = 0;
  let inspectT = 0; // clipboard-read beat during the north-end pause
  let bobT = 0;
  let lastStepPh = 0;
  let mode: WalkerMode = "normal";
  let chargeZ: number | null = null;
  const stepIfLanded = (stepping: boolean) => {
    const ph = Math.floor((bobT * 3.4) / Math.PI);
    if (ph !== lastStepPh) {
      lastStepPh = ph;
      if (stepping) api.onStep?.(g.position);
    }
  };

  const api: AmbientWalker = {
    reset() {
      mode = "normal";
      chargeZ = null;
      z = HOME_Z;
      dir = 1;
      pauseT = 0;
      inspectT = 0;
      fig.headPivot.rotation.x = 0;
      g.setEnabled(true);
      g.position.set(LANE_X, 0, z);
      g.rotation.y = dir > 0 ? 0 : Math.PI;
    },
    chargeAt(playerZ: number) {
      chargeZ = playerZ;
    },
    holdAt(zHold: number) {
      z = zHold;
      mode = "stare";
      pauseT = 0;
      g.setEnabled(true);
      g.rotation.y = Math.PI;
      g.position.set(LANE_X, 0, z);
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
      const lane = mode === "offlane" ? -LANE_X : LANE_X;
      if (mode === "stare") {
        // dead still except the slightest drift of the head
        g.position.set(lane, 0, z);
        for (const p of [...legPivots, ...armPivots]) p.rotation.x = 0;
        fig.headPivot.rotation.x = 0;
        return;
      }
      if (mode === "midstep") {
        // frozen mid-stride — legs split, arms mid-swing, facing his
        // direction of travel; reads normal at a glance and wrong the
        // moment you watch for the next step that never lands
        g.rotation.y = dir > 0 ? 0 : Math.PI;
        g.position.set(lane, 0, z);
        legPivots[0]!.rotation.x = 0.46;
        legPivots[1]!.rotation.x = -0.46;
        armPivots[0]!.rotation.x = -0.3;
        armPivots[1]!.rotation.x = 0.3;
        fig.headPivot.rotation.x = 0;
        return;
      }
      if (mode === "charge") {
        // the man you know runs at you — sprint along his lane until a
        // step behind the player, then hold there at your shoulder.
        // Driven per-frame by the anomaly through chargeAt().
        if (chargeZ === null) {
          g.position.set(lane, 0, z);
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
        g.position.set(lane, bob, z);
        const swing = closing ? Math.sin(bobT * 3.4) : 0;
        legPivots[0]!.rotation.x = swing * 0.62;
        legPivots[1]!.rotation.x = -swing * 0.62;
        armPivots[0]!.rotation.x = -swing * 0.4;
        armPivots[1]!.rotation.x = swing * 0.4;
        stepIfLanded(closing);
        return;
      }
      if (pauseT > 0) {
        pauseT -= dt;
        if (inspectT > 0) inspectT -= dt;
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
          // the north-end pause is where he does the job: turns to the
          // records bank, clipboard up, head down. Deterministic — every
          // loop, same end, same read — so it stays baseline.
          inspectT = PAUSE_S * 0.78;
          g.rotation.y = Math.PI / 2;
        }
        // facing follows mode: normally the direction of travel;
        // 'backwards' keeps him squared away from it (the moonwalk)
        const facing = mode === "backwards" ? -dir : dir;
        g.rotation.y = facing > 0 ? 0 : Math.PI;
      }
      // stride bob — tiny, readable at distance
      const bob = Math.abs(Math.sin(bobT * 3.4)) * 0.028;
      g.position.set(lane, bob, z);
      // limbs swing only while he's actually in stride
      const stepping = pauseT <= 0; // stare/absent returned above
      const swing = stepping ? Math.sin(bobT * 3.4) : 0;
      legPivots[0]!.rotation.x = swing * 0.5;
      legPivots[1]!.rotation.x = -swing * 0.5;
      armPivots[0]!.rotation.x = -swing * 0.32;
      armPivots[1]!.rotation.x = swing * 0.32;
      // the read: clipboard arm rises toward the face, head bows over
      // it — eases in over the pause's first beat, settles out at the
      // end. Overrides the swing-zeroed arm while inspectT lasts.
      if (inspectT > 0) {
        const rise = Math.min(1, Math.max(0, PAUSE_S - pauseT - 0.15) * 3.2);
        const settle = Math.min(1, inspectT * 2.4);
        const lift = Math.min(rise, settle);
        armPivots[0]!.rotation.x = -1.05 * lift;
        fig.headPivot.rotation.x = 0.34 * lift;
      } else {
        fig.headPivot.rotation.x = 0;
      }
      stepIfLanded(stepping);
    },
  };
  return api;
}
