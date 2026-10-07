/**
 * Modular kit primitives: repeatable manufactured parts on the 600 mm grid.
 * Everything returns meshes parented to a given node; colliders are separate
 * invisible geometry (never render meshes) so visual edits can't break
 * navigation.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Material } from "@babylonjs/core/Materials/material";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { MaterialSet } from "../materials/library";
import type { WorldRegistry } from "../registry";

export function box(
  name: string,
  w: number,
  h: number,
  d: number,
  material: Material,
  scene: Scene,
  parent?: TransformNode,
): AbstractMesh {
  const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.material = material;
  if (parent) m.parent = parent;
  return m;
}

export function collider(
  name: string,
  w: number,
  h: number,
  d: number,
  pos: Vector3,
  scene: Scene,
  parent?: TransformNode,
): AbstractMesh {
  const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.position = pos;
  m.isVisible = false; // collision only — still participates in checkCollisions
  m.checkCollisions = true;
  if (parent) m.parent = parent;
  return m;
}

export function plane(
  name: string,
  w: number,
  h: number,
  material: Material,
  scene: Scene,
  parent?: TransformNode,
): AbstractMesh {
  const m = CreatePlane(name, { width: w, height: h }, scene);
  m.material = material;
  if (parent) m.parent = parent;
  return m;
}

/** A wall run of panel modules between z0..z1 on side x (±). */
export function wallRun(
  name: string,
  x: number,
  z0: number,
  z1: number,
  height: number,
  material: Material,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
): AbstractMesh {
  const len = z1 - z0;
  const m = box(name, 0.12, height, len, material, scene, parent);
  m.position = new Vector3(x, height / 2, z0 + len / 2);
  registry.register(name, m);
  return m;
}

/** Recessed troffer: emissive diffuser in a steel frame. */
export function troffer(
  name: string,
  material: Material,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
): AbstractMesh {
  const frame = box(`${name}.frame`, 1.2, 0.06, 0.6, frameMat(), scene, parent);
  const diffuser = box(name, 1.1, 0.04, 0.5, material, scene, parent);
  diffuser.position.y = -0.045;
  diffuser.parent = frame;
  registry.register(name, diffuser);
  return frame;
}

let _frameMat: Material | null = null;
function frameMat(): Material {
  // Steel frames share the library steel; late-bound to avoid import cycles.
  if (!_frameMat) throw new Error("frameMat not initialized");
  return _frameMat;
}
export function setFrameMaterial(m: Material): void {
  _frameMat = m;
}

/** Sliding door: two steel halves that part along x. Returns both panels. */
export function slidingDoor(
  name: string,
  width: number,
  height: number,
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
): { left: AbstractMesh; right: AbstractMesh; frame: TransformNode } {
  const frame = new TransformNode(`${name}.frame`, scene);
  frame.parent = parent;
  const halfW = width / 2;
  const left = box(`${name}.L`, halfW, height, 0.1, mats.door, scene, frame);
  left.position = new Vector3(-halfW / 2, height / 2, 0);
  const right = box(`${name}.R`, halfW, height, 0.1, mats.door, scene, frame);
  right.position = new Vector3(halfW / 2, height / 2, 0);
  // lintel above the opening
  const lintel = box(`${name}.lintel`, width + 0.2, 0.35, 0.14, mats.steel, scene, frame);
  lintel.position = new Vector3(0, height + 0.17, 0);
  const jambL = box(`${name}.jambL`, 0.12, height, 0.14, mats.steel, scene, frame);
  jambL.position = new Vector3(-width / 2 - 0.06, height / 2, 0);
  const jambR = box(`${name}.jambR`, 0.12, height, 0.14, mats.steel, scene, frame);
  jambR.position = new Vector3(width / 2 + 0.06, height / 2, 0);
  registry.register(`${name}.L`, left);
  registry.register(`${name}.R`, right);
  return { left, right, frame };
}

/** Hanging double-sided wayfinding sign. */
export function hangingSign(
  specId: string,
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
  ceilingY: number,
): AbstractMesh {
  const mat = mats.sign.get(specId);
  if (!mat) throw new Error(`missing sign material: ${specId}`);
  const panel = box(`sign.${specId}`, 1.6, 0.5, 0.05, mat, scene, parent);
  panel.position.y = ceilingY - 0.45;
  const rod = box(`sign.${specId}.rod`, 0.03, 0.25, 0.03, mats.steel, scene, parent);
  rod.position = new Vector3(panel.position.x, ceilingY - 0.12, panel.position.z);
  registry.register(`sign.${specId}`, panel);
  return panel;
}

/** Flat wall-mounted sign plate. */
export function wallSign(
  specId: string,
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
  w = 1.2,
  h = 0.38,
): AbstractMesh {
  const mat = mats.sign.get(specId);
  if (!mat) throw new Error(`missing sign material: ${specId}`);
  const p = plane(`sign.${specId}`, w, h, mat, scene, parent);
  registry.register(`sign.${specId}`, p);
  return p;
}

/** The analog master clock: face + two hands as thin boxes on pivots. */
export function clock(
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
): { face: AbstractMesh; hourPivot: TransformNode; minutePivot: TransformNode } {
  const root = new TransformNode("clock", scene);
  root.parent = parent;
  const face = CreateDisc("clock.face", { radius: 0.28, tessellation: 48 }, scene);
  face.material = mats.clockFace;
  face.parent = root;
  const rim = CreateTorus("clock.rim", { diameter: 0.58, thickness: 0.03, tessellation: 48 }, scene);
  rim.material = mats.steel;
  rim.parent = root;

  const hourPivot = new TransformNode("clock.hour.pivot", scene);
  hourPivot.parent = root;
  const hourHand = box("clock.hour", 0.025, 0.14, 0.008, mats.clockHand, scene, hourPivot);
  hourHand.position.y = 0.07;
  const minutePivot = new TransformNode("clock.minute.pivot", scene);
  minutePivot.parent = root;
  const minuteHand = box("clock.minute", 0.018, 0.21, 0.008, mats.clockHand, scene, minutePivot);
  minuteHand.position.y = 0.105;
  const pin = CreateCylinder("clock.pin", { diameter: 0.03, height: 0.02, tessellation: 24 }, scene);
  pin.rotation.x = Math.PI / 2;
  pin.material = mats.steel;
  pin.parent = root;

  registry.register("clock.face", face);
  registry.register("clock.hour.pivot", hourPivot);
  registry.register("clock.minute.pivot", minutePivot);
  return { face, hourPivot, minutePivot };
}

/** Slatted bench — deliberately countable slats (prop.count bait). */
export function bench(
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
  name = "bench",
): TransformNode {
  const root = new TransformNode(name, scene);
  root.parent = parent;
  const slats = 5;
  for (let i = 0; i < slats; i++) {
    const slat = box(`${name}.slat.${i}`, 1.8, 0.04, 0.09, mats.steel, scene, root);
    slat.position = new Vector3(0, 0.45, -0.24 + i * 0.12);
    registry.register(`${name}.slat.${i}`, slat);
  }
  const legL = box(`${name}.legL`, 0.06, 0.45, 0.55, mats.steel, scene, root);
  legL.position = new Vector3(-0.8, 0.225, 0);
  const legR = box(`${name}.legR`, 0.06, 0.45, 0.55, mats.steel, scene, root);
  legR.position = new Vector3(0.8, 0.225, 0);
  registry.register(name, root);
  return root;
}

/** Wall fire cabinet — the prop.displaced reference object. */
export function fireCabinet(
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
): AbstractMesh {
  // surface-mount cabinet: 0.18 deep off the wall, 0.5 wide along it —
  // corridor-facing front (was a protruding column pre-fix)
  const body = box("fireCabinet", 0.18, 0.65, 0.5, mats.cabinetRed, scene, parent);
  registry.register("fireCabinet", body);
  return body;
}

/** Dome CCTV camera watching down the corridor. */
export function cctv(
  name: string,
  mats: MaterialSet,
  scene: Scene,
  parent: TransformNode,
  registry: WorldRegistry,
): TransformNode {
  const root = new TransformNode(name, scene);
  root.parent = parent;
  const dome = CreateSphere(`${name}.dome`, { diameter: 0.16, segments: 12 }, scene);
  dome.material = mats.rubber;
  dome.parent = root;
  dome.scaling.y = 0.7;
  // lens glint on the dome's forward edge — makes the watch direction readable
  const lens = CreateDisc(`${name}.lens`, { radius: 0.025, tessellation: 16 }, scene);
  lens.material = mats.cabinetRed;
  lens.parent = root;
  lens.position = new Vector3(0, -0.03, 0.078);
  const mount = box(`${name}.mount`, 0.05, 0.12, 0.05, mats.steel, scene, root);
  mount.position.y = 0.1;
  registry.register(name, root);
  return root;
}
