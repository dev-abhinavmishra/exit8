/**
 * Loop scatter — harmless baseline ephemera that re-placed every loop.
 * The corridor's fiction is that it is never pixel-identical: papers,
 * a cone, a carton drift between inspections, so a changed detail is
 * NOT automatically a divergence. Scatter is never registered, never
 * required by an anomaly, and never sits on an evidence anchor.
 */
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { RngStream } from "../../game/state/rng";
import * as kit from "./kit";
import type { MaterialSet } from "../materials/library";

interface ScatterVariant {
  /** unregistered mesh root — hidden between loops */
  node: TransformNode;
  spots: { x: number; z: number; yaw?: number }[];
  /** where this variant sat at the end of last loop's refresh, if placed */
  last?: { x: number; z: number; yaw: number };
}

export interface ScatterPool {
  /** Re-place a seeded subset for this loop index (0 = pre-loop clear). */
  refresh(loopIndex: number): void;
  /**
   * memory.persist — re-place the nth previously-placed variant at the
   * exact spot it occupied last loop, enabled even if this loop's draw
   * left it out. The corridor re-dresses everything else; one detail
   * refuses to move.
   */
  repeatLast(idx: number): void;
}

export function buildScatter(
  scene: Scene,
  parent: TransformNode,
  mats: MaterialSet,
  runSeed: string,
  registry?: { register(name: string, node: TransformNode): void },
): ScatterPool {
  // registered anchor so anomalies can name scatter as a dependency
  // without any individual variant becoming a registry node
  const anchor = new TransformNode("dress.scatter", scene);
  anchor.parent = parent;
  registry?.register("dress.scatter", anchor);
  const paper = new StandardMaterial("mat.scatter.paper", scene);
  paper.diffuseColor = new Color3(0.55, 0.52, 0.45);
  paper.specularColor = new Color3(0, 0, 0);
  const coneMat = new StandardMaterial("mat.scatter.cone", scene);
  coneMat.diffuseColor = new Color3(0.62, 0.2, 0.06);
  coneMat.specularColor = new Color3(0.08, 0.08, 0.08);
  const cartonMat = new StandardMaterial("mat.scatter.carton", scene);
  cartonMat.diffuseColor = new Color3(0.32, 0.24, 0.15);
  cartonMat.specularColor = new Color3(0.02, 0.02, 0.02);
  const wetMat = new StandardMaterial("mat.scatter.wet", scene);
  wetMat.diffuseColor = new Color3(0.55, 0.42, 0.08);
  wetMat.emissiveColor = new Color3(0.14, 0.1, 0.02);

  const variants: ScatterVariant[] = [];

  const node = (name: string) => {
    const n = new TransformNode(`dress.scatter.${name}`, scene);
    n.parent = anchor;
    n.setEnabled(false);
    return n;
  };

  // loose papers — three flat sheets drifting mid-corridor (bare-floor
  // only: evidence notes never sit on open floor, so these can't be
  // mistaken for one)
  {
    const n = node("papers");
    for (let i = 0; i < 3; i++) {
      const p = kit.plane(`dress.scatter.papers.${i}`, 0.2, 0.28, paper, scene, n);
      p.rotation.x = Math.PI / 2;
      p.rotation.z = i * 1.9 + 0.3;
      p.position.set((i - 1) * 0.22, 0.006 + i * 0.001, i * 0.18 - 0.15);
    }
    variants.push({
      node: n,
      spots: [
        { x: 0.3, z: 8 },
        { x: -0.5, z: 22 },
        { x: 0.7, z: 34 },
        { x: -0.9, z: 48 },
      ],
    });
  }

  // traffic cone
  {
    const n = node("cone");
    const c = CreateCylinder(
      "dress.scatter.cone.body",
      { height: 0.34, diameterTop: 0.05, diameterBottom: 0.22, tessellation: 10 },
      scene,
    );
    c.material = coneMat;
    c.parent = n;
    c.position.y = 0.17;
    const base = kit.box("dress.scatter.cone.base", 0.26, 0.02, 0.26, mats.rubber, scene, n);
    base.position.y = 0.01;
    const col = kit.collider("dress.scatter.cone.col", 0.3, 0.4, 0.3, new Vector3(0, 0.2, 0), scene, n);
    void col;
    variants.push({
      node: n,
      spots: [
        { x: 1.2, z: 12 },
        { x: -1.2, z: 30 },
        { x: 1.25, z: 44 },
      ],
    });
  }

  // mop bucket — dark tub + handle
  {
    const n = node("bucket");
    const tub = CreateCylinder(
      "dress.scatter.bucket.tub",
      { height: 0.26, diameter: 0.3, tessellation: 12 },
      scene,
    );
    tub.material = mats.rubber;
    tub.parent = n;
    tub.position.y = 0.13;
    const handle = kit.box("dress.scatter.bucket.handle", 0.02, 0.18, 0.3, mats.steel, scene, n);
    handle.position.y = 0.33;
    kit.collider("dress.scatter.bucket.col", 0.34, 0.3, 0.34, new Vector3(0, 0.15, 0), scene, n);
    variants.push({
      node: n,
      spots: [
        { x: -1.3, z: 17 },
        { x: 1.3, z: 39 },
        { x: -1.35, z: 51 },
      ],
    });
  }

  // cardboard carton
  {
    const n = node("carton");
    const b = kit.box("dress.scatter.carton.box", 0.38, 0.3, 0.3, cartonMat, scene, n);
    b.position.y = 0.15;
    const lid = kit.box("dress.scatter.carton.lid", 0.4, 0.03, 0.32, cartonMat, scene, n);
    lid.position.y = 0.315;
    kit.collider("dress.scatter.carton.col", 0.42, 0.34, 0.34, new Vector3(0, 0.17, 0), scene, n);
    variants.push({
      node: n,
      spots: [
        { x: 1.35, z: 6 },
        { x: -1.35, z: 29 },
        { x: 1.35, z: 46 },
      ],
    });
  }

  // power cord snaking from the wall
  {
    const n = node("cord");
    const a = kit.box("dress.scatter.cord.a", 1.1, 0.015, 0.03, mats.rubber, scene, n);
    a.position.set(-0.5, 0.008, 0);
    const b = kit.box("dress.scatter.cord.b", 0.03, 0.015, 0.8, mats.rubber, scene, n);
    b.position.set(0, 0.008, 0.4);
    variants.push({
      node: n,
      spots: [
        { x: 1.05, z: 14 },
        { x: -1.15, z: 36 },
      ],
    });
  }

  // rolled floor mat at a wall base
  {
    const n = node("matRoll");
    const r = CreateCylinder(
      "dress.scatter.matRoll.body",
      { height: 1.1, diameter: 0.22, tessellation: 10 },
      scene,
    );
    r.material = mats.concrete;
    r.parent = n;
    r.rotation.z = Math.PI / 2;
    r.rotation.y = 0.0;
    r.position.y = 0.11;
    kit.collider("dress.scatter.matRoll.col", 1.1, 0.24, 0.24, new Vector3(0, 0.12, 0), scene, n);
    variants.push({
      node: n,
      spots: [
        { x: -1.4, z: 10 },
        { x: 1.4, z: 42 },
      ],
    });
  }

  // wet-floor A-frame
  {
    const n = node("wetSign");
    const a = kit.plane("dress.scatter.wet.a", 0.34, 0.3, wetMat, scene, n);
    a.rotation.x = -0.35;
    a.position.set(0, 0.16, 0.06);
    const b = kit.plane("dress.scatter.wet.b", 0.34, 0.3, wetMat, scene, n);
    b.rotation.x = 0.35;
    b.rotation.y = Math.PI;
    b.position.set(0, 0.16, -0.06);
    kit.collider("dress.scatter.wet.col", 0.36, 0.34, 0.2, new Vector3(0, 0.17, 0), scene, n);
    variants.push({
      node: n,
      spots: [
        { x: 0.4, z: 20 },
        { x: -0.4, z: 38 },
      ],
    });
  }

  return {
    refresh(loopIndex: number) {
      const rng = new RngStream("loop.dressing", runSeed, `loop${loopIndex}`);
      for (const v of variants) v.node.setEnabled(false);
      const k = rng.int(0, 4); // 0–3 pieces per loop
      const pool = [...variants];
      for (let i = 0; i < k && pool.length > 0; i++) {
        const pick = pool.splice(rng.int(0, pool.length), 1)[0]!;
        const spot = pick.spots[rng.int(0, pick.spots.length)]!;
        const yaw = spot.yaw ?? rng.range(-0.35, 0.35) + (spot.x < 0 ? 0 : Math.PI);
        pick.node.position.set(spot.x, 0, spot.z);
        pick.node.rotation.y = yaw;
        pick.last = { x: spot.x, z: spot.z, yaw };
        pick.node.setEnabled(true);
      }
    },
    repeatLast(idx: number) {
      const cands = variants.filter((v) => v.last !== undefined);
      const v = cands[idx % cands.length] ?? variants[0];
      if (!v) return;
      const at = v.last ?? { ...v.spots[0]!, yaw: 0 };
      v.node.position.set(at.x, 0, at.z);
      v.node.rotation.y = at.yaw;
      v.node.setEnabled(true);
    },
  };
}
