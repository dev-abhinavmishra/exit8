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
  /** per-frame baseline motion — head turns to a close passerby;
   *  walkerPos feeds the passing-greeting: as the inspector crosses the
   *  bench he lifts his chin and dips the paper — a learned baseline
   *  courtesy (never returned). */
  update(dt: number, playerPos?: Vector3, walkerPos?: Vector3): void;
  /** anomalies may suppress the passing-greeting (commuter.ignores) */
  setGreetEnabled(on: boolean): void;
  /** baseline departure — he finishes his read, gathers paper + bag,
   *  and walks out through the south airlock (the door opens for him).
   *  `at` = seconds of corridor-open time; `north` walks him to the
   *  sealed north end instead (anomaly); `speed` multiplies stride.
   *  null suppresses the scheduled beat (commuter.stays). */
  setDepart(opts: { at: number; north?: boolean; speed?: number } | null): void;
  /** freeze/unfreeze mid-departure — the walk, his stride, the clock */
  setDepartHold(h: boolean): void;
  /** departure phase for anomaly choreographers */
  departState(): "none" | "gather" | "walk" | "wait" | "gone";
  /** app pulses the south door while this reads true */
  readonly wantsDoor: boolean;
  /** per-loop rebaseline: seat him (or not), or stand him at the
   * departure board checking times — a second learnable baseline */
  reset(present: boolean, mode?: "seat" | "board"): void;
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
  let mode: "seat" | "board" = "seat";
  let greetEnabled = true;
  let greeted = false;
  let greetT = 0;
  let lookT = 0;
  let pageT = 0;
  // the commute's end — a timed baseline exit: gather, then walk the
  // west lane to the airlock; anomalies retarget (north = the sealed
  // end), hurry (speed), or hold him mid-stride
  let depart: { at: number; north: boolean; speed: number } | null = null;
  let departPhase: "none" | "gather" | "walk" | "wait" | "gone" = "none";
  let departHold = false;
  let departClock = 0;
  let gatherT = 0;
  let walkT = 0;
  let doorWanted = false;

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

  const atBoard = () => {
    // standing north of the departure board at z40, tipped back to
    // read the flaps, paper folded under his arm, bag left at the seat
    g.position.set(0.35, 0, 38.7);
    g.rotation.set(0, 0.08, 0);
    hips[0]!.rotation.x = 0;
    hips[1]!.rotation.x = 0;
    arms[0]!.rotation.x = -0.45;
    arms[1]!.rotation.x = -0.1;
    head.rotation.set(-0.38, 0.02, 0);
    paper.position.set(0.06, 0.42, 0.16);
    paper.rotation.set(-0.9, Math.PI, 0.4);
    bag.position.set(SEAT_X - 0.05, SEAT_Y + 0.11, SEAT_Z + 0.44);
    bag.rotation.y = 0.3;
  };

  return {
    root: g,
    fig,
    isPresent: () => present,
    reset(p: boolean, m: "seat" | "board" = "seat") {
      present = p;
      mode = m;
      g.setEnabled(p);
      bag.setEnabled(p);
      paper.setEnabled(p);
      depart = null;
      departPhase = "none";
      departHold = false;
      departClock = 0;
      gatherT = 0;
      walkT = 0;
      doorWanted = false;
      if (m === "board") atBoard();
      else seat();
    },
    setDepart(opts) {
      depart = opts ? { at: opts.at, north: opts.north === true, speed: opts.speed ?? 1 } : null;
    },
    setDepartHold(h: boolean) {
      departHold = h;
    },
    departState: () => departPhase,
    get wantsDoor() {
      return doorWanted;
    },
    setGreetEnabled(on: boolean) {
      greetEnabled = on;
    },
    update(dt: number, playerPos?: Vector3, walkerPos?: Vector3) {
      if (!present || !playerPos) return;
      // the departure takes the frame once it starts — a man leaving
      // doesn't greet, glance, or turn pages
      if (departPhase !== "none" && departPhase !== "gone") {
        if (departHold) return;
        if (departPhase === "gather") {
          gatherT += dt;
          const lift = Math.min(1, gatherT / 1.5);
          // paper folds down to the lap, chin comes off the page —
          // the read of a man winding up his sit
          paper.rotation.x = -0.5 - lift * 0.5;
          paper.position.y = 0.52 - lift * 0.24;
          head.rotation.x = 0.42 - lift * 0.3;
          if (gatherT >= 1.5) {
            departPhase = "walk";
            walkT = 0;
            // to his feet
            hips[0]!.rotation.x = 0;
            hips[1]!.rotation.x = 0;
            arms[0]!.rotation.x = -0.15;
            arms[1]!.rotation.x = -0.15;
            head.rotation.set(0.12, 0, 0);
            g.position.y = 0;
          }
          return;
        }
        if (departPhase === "walk") {
          walkT += dt;
          const dir = depart!.north ? -1 : 1;
          const speed = 1.05 * depart!.speed;
          const p = g.position;
          // cross to the west lane first, then straight down the route
          p.x += (-0.55 - p.x) * Math.min(1, dt * 2.4);
          p.z += dir * speed * dt;
          const bob = Math.abs(Math.sin(walkT * 3.4)) * 0.028;
          p.y = bob;
          const swing = Math.sin(walkT * 3.4);
          hips[0]!.rotation.x = swing * 0.5;
          hips[1]!.rotation.x = -swing * 0.5;
          arms[0]!.rotation.x = -swing * 0.28;
          arms[1]!.rotation.x = swing * 0.28;
          g.rotation.y = dir > 0 ? 0 : Math.PI;
          // paper tucked under the near arm (local — it rides g),
          // bag carried at his side (root-level, world coords)
          paper.position.set(-0.16, 1.08, dir * 0.05);
          paper.rotation.set(-1.2, 0, 0.3);
          bag.position.set(p.x + 0.24, 0.52, p.z);
          bag.rotation.y = g.rotation.y;
          doorWanted = !depart!.north && p.z > 49;
          if (!depart!.north && p.z > 56.5) {
            // through the inner door and off the route
            departPhase = "gone";
            doorWanted = false;
            g.setEnabled(false);
            bag.setEnabled(false);
            paper.setEnabled(false);
          } else if (depart!.north && p.z < 6.5) {
            // the north end never opens — he stands facing it
            departPhase = "wait";
            g.rotation.y = Math.PI;
            hips[0]!.rotation.x = 0;
            hips[1]!.rotation.x = 0;
            arms[0]!.rotation.x = -0.12;
            arms[1]!.rotation.x = -0.12;
            head.rotation.x = -0.1;
            paper.position.set(-0.16, 1.08, -0.05);
            bag.position.set(p.x + 0.24, 0.52, p.z);
          }
          return;
        }
        if (departPhase === "wait") return; // stands at the sealed end
      }
      if (depart && mode === "seat") {
        departClock += dt;
        if (departClock >= depart.at && departPhase === "none") {
          departPhase = "gather";
          gatherT = 0;
        }
      }
      // the passing-greeting: the inspector crossing the bench z gets a
      // chin-lift and a dipped paper. Fires once per pass, re-arms when
      // he is clear of the bench again.
      if (greetEnabled && mode === "seat" && walkerPos) {
        if (!greeted && Math.abs(walkerPos.z - 33.3) < 1.4) {
          greetT = 1.15;
          greeted = true;
        } else if (Math.abs(walkerPos.z - 33.3) > 2.6) {
          greeted = false;
        }
      }
      if (greetT > 0) {
        greetT -= dt;
        const lift = Math.min(1, (1.15 - greetT) * 4) * Math.min(1, greetT * 3);
        head.rotation.x = 0.42 - lift * 0.55; // chin up, off the page
        paper.position.y = 0.52 - lift * 0.08;
        paper.rotation.x = -0.5 - lift * 0.2;
        return; // the greeting holds his pose for its beat
      }
      // glance up when someone passes close — a learned baseline habit;
      // anomalies that hold his gaze override this in their own update
      if (mode === "board") {
        const d2b = playerPos.subtract(g.getAbsolutePosition()).lengthSquared();
        if (d2b < 4.5) {
          lookT = Math.min(1, lookT + dt * 3.2);
        } else {
          lookT = Math.max(0, lookT - dt * 2.2);
        }
      }
      const d2 = playerPos.subtract(g.getAbsolutePosition()).lengthSquared();
      const near = d2 < 4.5;
      lookT += dt * (near ? 3.2 : -2.2);
      lookT = Math.max(0, Math.min(1, lookT));
      const lift = lookT * lookT;
      head.rotation.x = (mode === "board" ? -0.38 : 0.42) - lift * 0.5;
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
      if (mode === "board") return;
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
