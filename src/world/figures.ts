/**
 * Shared humanoid figure builder. Every person in the corridor — the
 * ambient inspector, his crowd twin, the watchers, the south figure —
 * comes from here so bodies read as PEOPLE, not stacked slabs:
 * shoes, trouser legs on hip pivots, a tapered coat with collar and
 * lapels, arms that taper sleeve→hand, and a real head — squashed
 * sphere skull, hair cap, and a drawn face plate.
 *
 * The "silhouette" kind keeps the same anatomy in one featureless
 * material: a watcher that has a body's outline is scarier than a
 * box, and its blank head is the point.
 *
 * Pivot names carry ".hip." / ".arm." — walker.crowd clones the
 * inspector via instantiateHierarchy and finds limb pivots by that
 * substring. Do not rename.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";

export interface Figure {
  root: TransformNode;
  /** head pivot at neck height — stare-drift and head-tilt hook */
  headPivot: TransformNode;
  /** leg pivots at hip height, [L, R] */
  hips: TransformNode[];
  /** arm pivots at shoulder height, [L, R] */
  arms: TransformNode[];
  headMesh: AbstractMesh;
}

export interface FigureOpts {
  kind: "inspector" | "silhouette";
  /** force every part to one material (emissive silhouettes etc.) */
  material?: Material;
  /** ~1.06 = the 1.9 m watcher build */
  heightScale?: number;
}

// The face: drawn once per figure as a DynamicTexture on a thin plate
// against the front of the skull. Kept low-contrast — institutional
// neutral, unsettling by restraint rather than by expression.
function faceTexture(name: string, scene: Scene): DynamicTexture {
  const t = new DynamicTexture(name, { width: 256, height: 320 }, scene, true);
  const c = t.getContext();
  (c as unknown as CanvasRenderingContext2D).scale(2, 2);
  // skin base — matches the head material, shading toward jaw
  const skin = c.createLinearGradient(0, 0, 0, 160);
  skin.addColorStop(0, "#8a6f5e");
  skin.addColorStop(0.7, "#83685a");
  skin.addColorStop(1, "#6f564b");
  c.fillStyle = skin;
  c.fillRect(0, 0, 128, 160);
  const stroke = "#2c211d";
  c.strokeStyle = stroke;
  c.fillStyle = stroke;
  c.lineWidth = 3;
  // hairline
  c.fillStyle = "#221a17";
  c.beginPath();
  c.moveTo(0, 30);
  c.quadraticCurveTo(64, 12, 128, 30);
  c.lineTo(128, 0);
  c.lineTo(0, 0);
  c.closePath();
  c.fill();
  // brows — level, close to the eyes: a neutral watcher's expression
  c.fillStyle = "#241b18";
  c.fillRect(26, 56, 30, 4);
  c.fillRect(72, 56, 30, 4);
  // eyes — dark almond lids, deeper pupil, the faintest lid line above
  const c2d = c as unknown as CanvasRenderingContext2D;
  c.fillStyle = "#171110";
  for (const cx of [41, 87]) {
    c2d.beginPath();
    c2d.ellipse(cx, 66, 12, 6, 0, 0, Math.PI * 2);
    c2d.fill();
    c.fillStyle = "#050404";
    c.beginPath();
    c.arc(cx, 66, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#171110";
    // upper lid crease
    c.strokeStyle = "#3d2e28";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 12, 61);
    c.quadraticCurveTo(cx, 57, cx + 12, 61);
    c.stroke();
  }
  // nose — ridge shadow + nostril hint
  c.strokeStyle = "#4d3a32";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(64, 70);
  c.lineTo(62, 96);
  c.stroke();
  c.beginPath();
  c.moveTo(56, 98);
  c.quadraticCurveTo(64, 103, 72, 98);
  c.stroke();
  // mouth — a thin closed line, no expression
  c.strokeStyle = "#38291f";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(44, 118);
  c.quadraticCurveTo(64, 121, 84, 118);
  c.stroke();
  // faint nasolabial + jaw shading
  c.strokeStyle = "#544139";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(40, 100);
  c.quadraticCurveTo(42, 114, 46, 122);
  c.moveTo(88, 100);
  c.quadraticCurveTo(86, 114, 82, 122);
  c.stroke();
  t.update();
  return t;
}

function box(
  name: string,
  w: number,
  h: number,
  d: number,
  material: Material,
  scene: Scene,
  parent: TransformNode,
  x: number,
  y: number,
  z: number,
): AbstractMesh {
  const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.material = material;
  m.position = new Vector3(x, y, z);
  m.parent = parent;
  return m;
}

/**
 * Build a ~1.78 m figure rooted at `parent`, feet at y=0, facing +Z.
 * Height scale applies to the root node.
 */
export function buildFigure(scene: Scene, parent: TransformNode, name: string, opts: FigureOpts): Figure {
  const g = new TransformNode(name, scene);
  g.parent = parent;
  const scale = opts.heightScale ?? 1;
  if (scale !== 1) g.scaling.setAll(scale);

  const sil = opts.kind === "silhouette";
  const one = opts.material;

  // materials — inspector palette unless overridden
  const coat = new StandardMaterial(`${name}.coat`, scene);
  coat.diffuseColor = sil ? new Color3(0.02, 0.02, 0.03) : new Color3(0.1, 0.11, 0.13);
  coat.specularColor = new Color3(0.02, 0.02, 0.02);
  const skin = new StandardMaterial(`${name}.skin`, scene);
  skin.diffuseColor = sil ? coat.diffuseColor.clone() : new Color3(0.4, 0.34, 0.3);
  skin.specularColor = new Color3(0.03, 0.03, 0.03);
  const hair = new StandardMaterial(`${name}.hair`, scene);
  hair.diffuseColor = sil ? coat.diffuseColor.clone() : new Color3(0.09, 0.07, 0.06);
  hair.specularColor = new Color3(0.02, 0.02, 0.02);
  const shoeMat = new StandardMaterial(`${name}.shoe`, scene);
  shoeMat.diffuseColor = sil ? coat.diffuseColor.clone() : new Color3(0.05, 0.05, 0.06);
  shoeMat.specularColor = new Color3(0.06, 0.06, 0.06);
  const use = (m: Material) => one ?? m;

  // ─── legs on hip pivots, shoes riding the leg end ────────────────
  const hips: TransformNode[] = [];
  for (const sx of [-1, 1]) {
    const hip = new TransformNode(`${name}.hip.${sx}`, scene);
    hip.parent = g;
    hip.position = new Vector3(sx * 0.11, 0.86, 0);
    box(`${name}.leg.${sx}`, 0.14, 0.8, 0.15, use(coat), scene, hip, 0, -0.42, 0);
    // shoe — slightly forward of the leg axis, swings with the stride
    box(`${name}.shoe.${sx}`, 0.13, 0.09, 0.27, use(shoeMat), scene, hip, 0, -0.81, 0.05);
    hips.push(hip);
  }

  // ─── coat: hem → waist → chest → shoulders (tapered, not a slab) ─
  box(`${name}.coat.hem`, 0.46, 0.4, 0.26, use(coat), scene, g, 0, 0.72, 0);
  box(`${name}.coat.waist`, 0.4, 0.3, 0.23, use(coat), scene, g, 0, 1.02, 0);
  box(`${name}.chest`, 0.44, 0.4, 0.25, use(coat), scene, g, 0, 1.3, 0);
  box(`${name}.shoulders`, 0.58, 0.12, 0.28, use(coat), scene, g, 0, 1.52, 0);

  if (!sil) {
    // hi-vis band — the Authority's inspectors wear one
    const band = new StandardMaterial(`${name}.band`, scene);
    band.emissiveColor = new Color3(0.9, 0.68, 0.22).scale(0.55);
    band.disableLighting = true;
    box(`${name}.stripe`, 0.45, 0.09, 0.26, band, scene, g, 0, 1.28, 0);
    // collar + lapels — the coat closes up the front
    box(`${name}.collar`, 0.3, 0.07, 0.24, use(coat), scene, g, 0, 1.585, 0.01);
    const lapel = new StandardMaterial(`${name}.lapel`, scene);
    lapel.diffuseColor = new Color3(0.05, 0.055, 0.065);
    // thin angled panels catch a white specular streak under the
    // troffers — keep them near-matte so they read as dark lapels
    lapel.specularColor = new Color3(0.01, 0.01, 0.01);
    for (const sx of [-1, 1]) {
      const l = box(`${name}.lapel.${sx}`, 0.09, 0.34, 0.012, lapel, scene, g, sx * 0.1, 1.33, 0.13);
      l.rotation.z = sx * 0.22;
      l.rotation.x = -0.06;
    }
    // neck
    const neck = CreateCylinder(`${name}.neck`, { height: 0.1, diameter: 0.11, tessellation: 10 }, scene);
    neck.material = use(skin);
    neck.position = new Vector3(0, 1.6, 0);
    neck.parent = g;
  }

  // ─── arms on shoulder pivots — sleeve tapering to a bare hand ────
  const arms: TransformNode[] = [];
  for (const sx of [-1, 1]) {
    const arm = new TransformNode(`${name}.arm.${sx}`, scene);
    arm.parent = g;
    arm.position = new Vector3(sx * 0.31, 1.48, 0);
    box(`${name}.sleeve.up.${sx}`, 0.1, 0.34, 0.12, use(coat), scene, arm, 0, -0.17, 0);
    box(`${name}.sleeve.lo.${sx}`, 0.088, 0.3, 0.1, use(coat), scene, arm, 0, -0.46, 0.005);
    if (!sil) box(`${name}.hand.${sx}`, 0.075, 0.11, 0.08, use(skin), scene, arm, 0, -0.64, 0.01);
    arms.push(arm);
  }

  // ─── head: sphere skull (elongated for silhouettes), hair, face ──
  const headPivot = new TransformNode(`${name}.headPivot`, scene);
  headPivot.parent = g;
  headPivot.position = new Vector3(0, 1.58, 0);
  const headMesh = CreateSphere(`${name}.head`, { diameter: 0.22, segments: 10 }, scene);
  headMesh.material = use(skin);
  headMesh.scaling = new Vector3(1, sil ? 1.5 : 1.28, 0.96);
  headMesh.position = new Vector3(0, 0.19, 0);
  headMesh.parent = headPivot;
  if (!sil) {
    // hair cap — slightly proud of the skull
    const cap = CreateSphere(`${name}.hair`, { diameter: 0.235, segments: 10 }, scene);
    cap.material = use(hair);
    cap.scaling = new Vector3(1.02, 0.72, 1.0);
    cap.position = new Vector3(0, 0.27, -0.015);
    cap.parent = headPivot;
    // face plate — drawn texture on a thin slab against the skull front
    const faceMat = new StandardMaterial(`${name}.face`, scene);
    faceMat.diffuseTexture = faceTexture(`${name}.face.tex`, scene);
    faceMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const face = CreateBox(`${name}.faceplate`, { width: 0.17, height: 0.22, depth: 0.008 }, scene);
    face.material = faceMat;
    face.position = new Vector3(0, 0.17, 0.1);
    face.parent = headPivot;
  }

  return { root: g, headPivot, hips, arms, headMesh };
}
