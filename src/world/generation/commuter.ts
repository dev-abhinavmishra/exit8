/**
 * The commuter — a second ambient presence, BASELINE like the walker.
 * He is a civilian waiting on the mid-corridor bench: present on most
 * loops but not all of them, always seated reading a folded paper,
 * always glancing up when you pass close. His habits are learnable —
 * so a commuter who stands, stares, or leaves the wrong thing behind
 * is a divergence.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { buildFigure, type Figure } from "../figures";
import type { MaterialSet } from "../materials/library";
import type { WorldRegistry } from "../registry";

export interface Commuter {
  /** per-frame baseline motion — head turns to a close passerby */
  update(dt: number, playerPos?: Vector3): void;
  /** per-loop rebaseline: seat him (or not), restore seated pose */
  reset(present: boolean): void;
  /** anomaly handle — the figure root (position/rotation/enabled) */
  root: TransformNode;
  /** figure pivots (hips, arms, headPivot) for anomaly posing */
  fig: Figure;
  isPresent(): boolean;
}

const SEAT_X = -1.3;
const SEAT_Z = 33.3;
const SEAT_Y = 0.42;

export function buildCommuter(
  scene: Scene,
  root: TransformNode,
  _mats: MaterialSet,
  registry: WorldRegistry,
): Commuter {
  // civilian read: the shared inspector body minus the Authority kit —
  // no hi-vis band, no peaked cap, no ID card. At a glance he is not
  // one of them; at memorization distance he is still a real person.
  const fig = buildFigure(scene, root, "commuter.fig", { kind: "inspector" });
  const g = fig.root;
  registry.register("commuter", g);
  for (const m of g.getChildMeshes()) {
    if (m.name.includes(".stripe") || m.name.includes(".cap.") || m.name.includes(".idcard")) {
      m.setEnabled(false);
    }
  }
  const hips = fig.hips;
  const arms = fig.arms;
  const head = fig.headPivot;

  // the folded paper he always holds — grey newsprint sheet, faint
  // column rule so it reads as print at two metres
  const paperMat = new StandardMaterial("commuter.paper", scene);
  const pt = new DynamicTexture("tex.commuter.paper", { width: 128, height: 96 }, scene, true);
  const pc = pt.getContext();
  pc.fillStyle = "#b9b4a6";
  pc.fillRect(0, 0, 128, 96);
  pc.fillStyle = "#4a463c";
  pc.fillRect(8, 8, 112, 12); // headline bar
  pc.fillStyle = "#6f6a5c";
  for (let i = 0; i < 6; i++) {
    pc.fillRect(8, 28 + i * 10, 52, 4);
    pc.fillRect(68, 28 + i * 10, 52, 4);
  }
  paperMat.diffuseTexture = pt;
  paperMat.specularColor = new Color3(0.02, 0.02, 0.02);
  const paper = CreatePlane("commuter.paper.sheet", { width: 0.24, height: 0.18 }, scene);
  paper.material = paperMat;
  paper.parent = g;
  registry.register("commuter.paper", paper);

  // his bag — a soft satchel parked at his feet on the bench end
  const bagMat = new StandardMaterial("commuter.bag", scene);
  bagMat.diffuseColor = new Color3(0.14, 0.11, 0.08);
  bagMat.specularColor = new Color3(0.03, 0.03, 0.03);
  const bag = CreateBox("commuter.bag", { width: 0.3, height: 0.22, depth: 0.14 }, scene);
  bag.material = bagMat;
  bag.parent = root;
  registry.register("commuter.bag", bag);

  let present = true;
  let lookT = 0;
  let pageT = 0;

  const seat = () => {
    // seated on the bench end nearest the walkway, facing out — thighs
    // forward off the seat, torso upright, head bowed over the paper
    g.position.set(SEAT_X, SEAT_Y, SEAT_Z);
    g.rotation.set(0, Math.PI / 2 - 0.15, 0);
    hips[0]!.rotation.x = -1.45;
    hips[1]!.rotation.x = -1.5;
    arms[0]!.rotation.x = -0.62;
    arms[1]!.rotation.x = -0.7;
    head.rotation.set(0.42, 0.05, 0);
    paper.position.set(0.02, 0.52, 0.18);
    paper.rotation.set(-0.5, Math.PI, 0.06);
    bag.position.set(SEAT_X - 0.05, SEAT_Y + 0.11, SEAT_Z + 0.44);
    bag.rotation.y = 0.3;
  };

  return {
    root: g,
    fig,
    isPresent: () => present,
    reset(p: boolean) {
      present = p;
      g.setEnabled(p);
      bag.setEnabled(p);
      seat();
    },
    update(dt: number, playerPos?: Vector3) {
      if (!present || !playerPos) return;
      // glance up when someone passes close — a learned baseline habit;
      // anomalies that hold his gaze override this in their own update
      const d2 = playerPos.subtract(g.getAbsolutePosition()).lengthSquared();
      const near = d2 < 4.5;
      lookT += dt * (near ? 3.2 : -2.2);
      lookT = Math.max(0, Math.min(1, lookT));
      const lift = lookT * lookT;
      head.rotation.x = 0.42 - lift * 0.5;
      // drift his chin toward the player's bearing, gently
      if (lift > 0.02) {
        const dx = playerPos.x - g.getAbsolutePosition().x;
        const dz = playerPos.z - g.getAbsolutePosition().z;
        const yawTo = Math.atan2(dx, dz) - g.rotation.y;
        const wrap = Math.atan2(Math.sin(yawTo), Math.cos(yawTo));
        head.rotation.y = 0.05 + wrap * lift * 0.6;
      }
      // page turn every half minute or so — both arms flick a beat
      pageT += dt;
      if (pageT > 28) {
        pageT = 0;
        arms[1]!.rotation.x = -0.7 - 0.35;
        setTimeout(() => {
          arms[1]!.rotation.x = -0.7;
        }, 380);
      }
    },
  };
}
