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
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
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

/**
 * Paint the inspector face onto a DynamicTexture. `blank` draws only
 * the skin gradient and cap-shadow band — the faceless-erasure anomaly
 * needs exactly the smooth leftover.
 */
export function drawFace(t: DynamicTexture, blank = false): void {
  const c = t.getContext();
  (c as unknown as CanvasRenderingContext2D).setTransform(1, 0, 0, 1, 0, 0);
  (c as unknown as CanvasRenderingContext2D).scale(2, 2);
  // the plate's edges are transparent — an oval face region paints ON
  // the skull instead of reading as a slab floating proud of it
  c.clearRect(0, 0, 128, 160);
  const c2d = c as unknown as CanvasRenderingContext2D;
  // narrower, longer oval — a tired adult face, not a round minifig
  c2d.beginPath();
  c2d.ellipse(64, 80, 54, 78, 0, 0, Math.PI * 2);
  c2d.clip();
  // sallow institutional skin, pale under fluorescents, shadowing
  // toward the jaw and temples
  const skin = c.createLinearGradient(0, 0, 0, 160);
  skin.addColorStop(0, "#a08b78");
  skin.addColorStop(0.6, "#97816e");
  skin.addColorStop(1, "#74604f");
  c.fillStyle = skin;
  c.fillRect(0, 0, 128, 160);
  // cheek hollows — soft gray wash from temple to jaw = gaunt
  if (!blank) {
    const hollow = c.createLinearGradient(0, 84, 0, 134);
    hollow.addColorStop(0, "rgba(70,55,45,0)");
    hollow.addColorStop(0.5, "rgba(70,55,45,0.22)");
    hollow.addColorStop(1, "rgba(70,55,45,0.06)");
    c.fillStyle = hollow;
    c.beginPath();
    c2d.ellipse(30, 108, 18, 30, -0.25, 0, Math.PI * 2);
    c2d.fill();
    c.beginPath();
    c2d.ellipse(98, 108, 18, 30, 0.25, 0, Math.PI * 2);
    c2d.fill();
  }
  if (!blank) {
    // hairline — receding at the corners
    c.fillStyle = "#221a17";
    c.beginPath();
    c.moveTo(8, 34);
    c.quadraticCurveTo(64, 16, 120, 34);
    c.lineTo(120, 0);
    c.lineTo(8, 0);
    c.closePath();
    c.fill();
    // brows — thin, level, slightly down at the inner ends: tired
    c.strokeStyle = "#2b211c";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(32, 58);
    c.quadraticCurveTo(44, 55, 56, 57);
    c.moveTo(72, 57);
    c.quadraticCurveTo(84, 55, 96, 58);
    c.stroke();
    // eyes — pale whites with a small dark iris read more human than
    // a solid almond, and the gaze carries across the corridor
    for (const cx of [40, 88]) {
      c.fillStyle = "#c9bfb0";
      c.beginPath();
      c2d.ellipse(cx, 66, 10, 4.5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#171210";
      c.beginPath();
      c.arc(cx, 66.5, 3.4, 0, Math.PI * 2);
      c.fill();
      // upper lid crease + a heavy lid line = tired
      c.strokeStyle = "#4a382e";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(cx - 10, 62);
      c.quadraticCurveTo(cx, 58.5, cx + 10, 62);
      c.stroke();
      // faint bag under the eye
      c.strokeStyle = "rgba(90,68,55,0.4)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(cx - 8, 72);
      c.quadraticCurveTo(cx, 75, cx + 8, 72);
      c.stroke();
    }
  }
  // brim shadow — the service cap throws a soft band over the brow
  const shade = c.createLinearGradient(0, 26, 0, 66);
  shade.addColorStop(0, "rgba(20,14,12,0.55)");
  shade.addColorStop(1, "rgba(20,14,12,0)");
  c.fillStyle = shade;
  c.fillRect(0, 26, 128, 40);
  if (!blank) {
    // nose — ridge shadow + nostril hint
    c.strokeStyle = "#5b4537";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(64, 70);
    c.lineTo(62, 96);
    c.stroke();
    c.beginPath();
    c.moveTo(56, 98);
    c.quadraticCurveTo(64, 103, 72, 98);
    c.stroke();
    // mouth — dead level, slightly downturned at the corners
    c.strokeStyle = "#3a2b21";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(46, 117);
    c.lineTo(82, 117);
    c.stroke();
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(46, 117);
    c.lineTo(44, 119);
    c.moveTo(82, 117);
    c.lineTo(84, 119);
    c.stroke();
    // faint nasolabial folds
    c.strokeStyle = "#5f4a3d";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(42, 100);
    c.quadraticCurveTo(44, 112, 48, 120);
    c.moveTo(86, 100);
    c.quadraticCurveTo(84, 112, 80, 120);
    c.stroke();
  }
  t.update();
}

// The face: drawn once per figure as a DynamicTexture on a thin plate
// against the front of the skull. Kept low-contrast — institutional
// neutral, unsettling by restraint rather than by expression.
function faceTexture(name: string, scene: Scene): DynamicTexture {
  const t = new DynamicTexture(name, { width: 256, height: 320 }, scene, true);
  t.hasAlpha = true;
  drawFace(t);
  return t;
}

// soft radial contact shadow — grounds the figure on the terrazzo
// instead of letting feet float on a lit slab
function blobTexture(name: string, scene: Scene): DynamicTexture {
  const t = new DynamicTexture(name, { width: 128, height: 128 }, scene, true);
  t.hasAlpha = true;
  const c = t.getContext();
  const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.7, "rgba(0,0,0,0.26)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
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
  // darker slate — under direct troffers 0.1 still read as pale mannequin
  coat.diffuseColor = sil ? new Color3(0.02, 0.02, 0.03) : new Color3(0.05, 0.055, 0.07);
  coat.specularColor = new Color3(0.015, 0.015, 0.015);
  coat.specularPower = 128;
  const skin = new StandardMaterial(`${name}.skin`, scene);
  skin.diffuseColor = sil ? coat.diffuseColor.clone() : new Color3(0.4, 0.34, 0.3);
  skin.specularColor = new Color3(0.03, 0.03, 0.03);
  const card = new StandardMaterial(`${name}.card`, scene);
  card.diffuseColor = new Color3(0.8, 0.79, 0.74);
  card.emissiveColor = new Color3(0.18, 0.18, 0.16);
  card.specularColor = new Color3(0.04, 0.04, 0.04);
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
    // chest ID card — a white clip badge on the left breast
    box(`${name}.idcard`, 0.05, 0.07, 0.008, card, scene, g, 0.11, 1.37, 0.128);
    const lapel = new StandardMaterial(`${name}.lapel`, scene);
    lapel.diffuseColor = new Color3(0.05, 0.055, 0.065);
    // thin angled panels catch a white specular streak under the
    // troffers — keep them near-matte so they read as dark lapels
    lapel.specularColor = new Color3(0.01, 0.01, 0.01);
    // lapels — narrow panels meeting at the sternum in a V below the
    // collar, not strap bars across the chest
    for (const sx of [-1, 1]) {
      const l = box(`${name}.lapel.${sx}`, 0.07, 0.3, 0.01, lapel, scene, g, sx * 0.065, 1.42, 0.132);
      l.rotation.z = -sx * 0.38;
      l.rotation.x = -0.05;
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
    // hair shell — a second squashed sphere tucked behind the face
    // line; covers crown + back of head under the cap
    const hair = CreateSphere(`${name}.hair`, { diameter: 0.225, segments: 10 }, scene);
    hair.material = use(shoeMat);
    hair.scaling = new Vector3(1.0, 1.22, 0.92);
    hair.position = new Vector3(0, 0.215, -0.028);
    hair.parent = headPivot;
    // peaked service cap — crown, band, and brim over the skull
    const crown = CreateCylinder(
      `${name}.cap.crown`,
      { height: 0.09, diameter: 0.21, tessellation: 14 },
      scene,
    );
    crown.material = use(coat);
    crown.position = new Vector3(0, 0.315, 0);
    crown.parent = headPivot;
    const band = CreateCylinder(
      `${name}.cap.band`,
      { height: 0.028, diameter: 0.205, tessellation: 14 },
      scene,
    );
    band.material = use(shoeMat);
    band.position = new Vector3(0, 0.275, 0);
    band.parent = headPivot;
    box(`${name}.cap.brim`, 0.15, 0.015, 0.13, use(shoeMat), scene, headPivot, 0, 0.272, 0.13);
    // face plate — drawn texture on a thin slab against the skull front
    const faceMat = new StandardMaterial(`${name}.face`, scene);
    faceMat.diffuseTexture = faceTexture(`${name}.face.tex`, scene);
    // near-zero specular — the plate was catching a white glint blob
    faceMat.specularColor = new Color3(0.004, 0.004, 0.004);
    faceMat.specularPower = 128;
    faceMat.useAlphaFromDiffuseTexture = true;
    const face = CreatePlane(`${name}.faceplate`, { width: 0.17, height: 0.22 }, scene);
    face.material = faceMat;
    // proud of the skull's front tip (z≈0.1056) — it poked through as a
    // pale diamond artifact before. A single-sided plane, not a box: a
    // box's rear face mapped the same texture and read as a face on the
    // back of the head from behind.
    face.position = new Vector3(0, 0.17, 0.112);
    face.rotation.y = Math.PI;
    face.parent = headPivot;
  }

  // contact shadow — rides the root so it follows patrols and freezes
  // with watchers; the stride bob lifts it at most 3 cm, invisible
  const shadowMat = new StandardMaterial(`${name}.blobshadow`, scene);
  shadowMat.diffuseTexture = blobTexture(`${name}.blobshadow.tex`, scene);
  shadowMat.useAlphaFromDiffuseTexture = true;
  shadowMat.disableLighting = true;
  shadowMat.alphaMode = 2;
  shadowMat.backFaceCulling = false;
  const blob = CreatePlane(`${name}.blobshadow`, { width: 0.75, height: 0.55 }, scene);
  blob.material = shadowMat;
  blob.rotation.x = -Math.PI / 2;
  blob.position = new Vector3(0, 0.012, 0);
  blob.parent = g;

  return { root: g, headPivot, hips, arms, headMesh };
}
