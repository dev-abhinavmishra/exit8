/**
 * Inspection Loop 7 — the baseline concourse. Layout is fixed and learnable:
 * North Airlock → records wall → wayfinding → observation gallery → clinic
 * intake → service junction → South Airlock. ~55 m of corridor plus two
 * 5 m airlock vestibules.
 *
 * All geometry is procedural (600 mm grid); every anomaly-targetable piece
 * is named in the WorldRegistry.
 */
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { WorldRegistry } from "../registry";
import { buildMaterials, type MaterialSet } from "../materials/library";
import { buildTextureSet, makeVendingFace, type TextureSet } from "./textures";
import { RngStream } from "../../game/state/rng";
import { SIGNS } from "../../data/signage";
import * as kit from "./kit";
import { buildScatter, type ScatterPool } from "./scatter";
import { buildAmbientWalker, type AmbientWalker } from "./ambientWalker";
import { buildFixtures } from "./fixtures";
import { mergeStaticDressing } from "../merge";

export const LAYOUT = {
  corridor: { xHalf: 1.8, z0: 0, z1: 55, height: 3.0 },
  airlockWidth: 2.4,
  airlockDepth: 5,
  northAirlock: { z0: -5, z1: 0 },
  southAirlock: { z0: 55, z1: 60 },
  commitNorthZ: -2.8,
  commitSouthZ: 57.8,
  spawn: new Vector3(0, 0, -2.4),
  spawnYaw: 0, // facing +Z
  eyeHeight: 1.62,
} as const;

export interface DoorRig {
  frame: TransformNode;
  left: AbstractMesh;
  right: AbstractMesh;
  leftCollider: AbstractMesh;
  rightCollider: AbstractMesh;
  /** 0 = closed, 1 = open (driven by LoopManager each frame) */
  open01: number;
  target01: number;
}

export interface LightZone {
  name: string;
  point: PointLight;
  troffers: AbstractMesh[];
  /** fake volumetric shafts hanging under the troffers — die with them */
  shafts: TransformNode[];
  /** corridor z extents this zone covers (for passage-tracking anomalies) */
  z0: number;
  z1: number;
  /** zone color target for lighting anomalies */
  baseDiffuse: Color3;
}

export interface ConcourseWorld {
  root: TransformNode;
  registry: WorldRegistry;
  materials: MaterialSet;
  textures: TextureSet;
  colliders: AbstractMesh[];
  doors: { northInner: DoorRig; southInner: DoorRig };
  zones: LightZone[];
  hemi: HemisphericLight;
  /** doorway.extra prebuilt hidden room */
  extraRoom: TransformNode;
  extraRoomSpill: PointLight;
  /** depth.mismatch prebuilt room — a gallery deeper than the wall allows */
  depthRoom: TransformNode;
  depthSpill: PointLight;
  condensationPatch: AbstractMesh;
  /** clock hands for the clock anomalies */
  clock: { hourPivot: TransformNode; minutePivot: TransformNode; face: AbstractMesh };
  /** footstep-emitter anchor list (positions the footstep synth reads) */
  anchors: {
    clock: Vector3;
    junctionMachine: Vector3;
    vents: Vector3[];
    /** troffer-row emitter points for the fluorescent hum */
    troffers: Vector3[];
  };
  /** per-loop harmless scatter — refreshed on every rebaseline */
  scatter: ScatterPool;
  /** the baseline inspector figure — reset every rebaseline */
  ambientWalker: AmbientWalker;
}

/** Late-bound detail materials — small shared surfaces, never registry-reached. */
let _hazardBandMat: StandardMaterial | null = null;
function hazardBandMaterial(scene: Scene): StandardMaterial {
  if (_hazardBandMat) return _hazardBandMat;
  const tex = new DynamicTexture("tex.hazardBand", { width: 512, height: 64 }, scene, true);
  const c = tex.getContext() as unknown as CanvasRenderingContext2D;
  c.scale(2, 2);
  c.fillStyle = "#c79b27";
  c.fillRect(0, 0, 256, 32);
  c.fillStyle = "#1b1c1e";
  for (let x = -32; x < 256; x += 32) {
    c.beginPath();
    c.moveTo(x, 32);
    c.lineTo(x + 16, 32);
    c.lineTo(x + 32, 0);
    c.lineTo(x + 16, 0);
    c.closePath();
    c.fill();
  }
  tex.update();
  _hazardBandMat = new StandardMaterial("mat.hazardBand", scene);
  _hazardBandMat.diffuseTexture = tex;
  _hazardBandMat.specularColor = Color3.Black();
  return _hazardBandMat;
}

let _doorGlassMat: StandardMaterial | null = null;
function doorGlassMaterial(scene: Scene): StandardMaterial {
  if (_doorGlassMat) return _doorGlassMat;
  _doorGlassMat = new StandardMaterial("mat.doorGlass", scene);
  _doorGlassMat.diffuseColor = new Color3(0.04, 0.055, 0.065);
  _doorGlassMat.specularColor = new Color3(0.45, 0.5, 0.55);
  _doorGlassMat.emissiveColor = new Color3(0.008, 0.012, 0.016);
  return _doorGlassMat;
}

function buildAirlock(
  side: "north" | "south",
  scene: Scene,
  mats: MaterialSet,
  registry: WorldRegistry,
  root: TransformNode,
  colliders: AbstractMesh[],
): DoorRig {
  const z0 = side === "north" ? LAYOUT.northAirlock.z0 : LAYOUT.southAirlock.z0;
  const z1 = side === "north" ? LAYOUT.northAirlock.z1 : LAYOUT.southAirlock.z1;
  const w = LAYOUT.airlockWidth;
  const h = LAYOUT.corridor.height;
  const zc = (z0 + z1) / 2;

  const al = new TransformNode(`airlock.${side}`, scene);
  al.parent = root;

  // floor / ceiling
  const floor = kit.box(`al.${side}.floor`, w, 0.1, z1 - z0, mats.concrete, scene, al);
  floor.position = new Vector3(0, -0.05, zc);
  const ceil = kit.box(`al.${side}.ceiling`, w, 0.1, z1 - z0, mats.ceiling, scene, al);
  ceil.position = new Vector3(0, h + 0.05, zc);

  // walls (x = ±w/2)
  for (const sx of [-1, 1]) {
    const wall = kit.box(`al.${side}.wall.${sx}`, 0.12, h, z1 - z0, mats.wallPanel, scene, al);
    wall.position = new Vector3((sx * w) / 2, h / 2, zc);
    colliders.push(
      kit.collider(`al.${side}.wallCol.${sx}`, 0.12, h, z1 - z0, wall.position.clone(), scene, al),
    );
  }

  // outer end cap (sealed — the loop never truly exits)
  const endZ = side === "north" ? z0 : z1;
  const cap = kit.box(`al.${side}.cap`, w, h, 0.12, mats.steel, scene, al);
  cap.position = new Vector3(0, h / 2, endZ);
  registry.register(`al.${side}.cap`, cap);
  colliders.push(kit.collider(`al.${side}.capCol`, w, h, 0.12, cap.position.clone(), scene, al));

  // cap face dressing — the wall every player walks toward to commit.
  // Parented to the cap mesh so airlock.breach hides it with the slab.
  const capFace = side === "north" ? 0.065 : -0.065;
  const capRot = side === "north" ? Math.PI : 0;
  const band = kit.plane(`al.${side}.cap.hazard`, w - 0.24, 0.2, hazardBandMaterial(scene), scene);
  band.parent = cap;
  band.position = new Vector3(0, 0.95 - h / 2, capFace);
  band.rotation.y = capRot;
  const plaqueMat = mats.sign.get("sign.cap.plaque");
  if (!plaqueMat) throw new Error("missing sign material: sign.cap.plaque");
  const plaque = kit.plane(`al.${side}.cap.plaque`, 0.9, 0.28, plaqueMat, scene);
  plaque.parent = cap;
  plaque.position = new Vector3(0, 2.32 - h / 2, capFace);
  plaque.rotation.y = capRot;
  for (const [bx, btag] of [
    [-w / 2 + 0.16, "l"],
    [w / 2 - 0.16, "r"],
  ] as const) {
    const bolt = kit.box(`al.${side}.cap.bolt.${btag}`, 0.04, 0.04, 0.02, mats.rubber, scene);
    bolt.parent = cap;
    bolt.position = new Vector3(bx, 2.32 - h / 2, capFace);
  }

  // commit stripe on the floor at the commit plane
  const stripeZ = side === "north" ? LAYOUT.commitNorthZ : LAYOUT.commitSouthZ;
  const stripe = kit.box(`al.${side}.commitStripe`, w - 0.3, 0.012, 0.18, mats.commitmentStripe, scene, al);
  stripe.position = new Vector3(0, 0.006, stripeZ);
  registry.register(`al.${side}.commitStripe`, stripe);

  // inner sliding door at the corridor mouth (z1 for north, z0 for south)
  const doorZ = side === "north" ? z1 : z0;
  const doorNode = new TransformNode(`door.${side}.inner`, scene);
  doorNode.parent = al;
  doorNode.position = new Vector3(0, 0, doorZ);
  const d = kit.slidingDoor(`door.${side}.inner`, w, h - 0.35, mats, scene, doorNode, registry);
  // leaf hardware — parented to each leaf so it rides the slide
  const leafH = h - 0.35;
  const faceZ = side === "north" ? 0.062 : -0.062; // corridor-facing leaf surface
  const glass = doorGlassMaterial(scene);
  for (const [leaf, edgeSign, tag] of [
    [d.left, 1, "L"],
    [d.right, -1, "R"],
  ] as const) {
    for (const f of [faceZ, -faceZ]) {
      const handle = kit.box(
        `door.${side}.inner.${tag}.handle.${f > 0 ? "c" : "a"}`,
        0.035,
        0.48,
        0.045,
        mats.steel,
        scene,
      );
      handle.parent = leaf;
      handle.position = new Vector3(edgeSign * (w / 4 - 0.14), 1.05 - leafH / 2, f);
    }
    const kick = kit.box(`door.${side}.inner.${tag}.kick`, w / 2 - 0.06, 0.22, 0.012, mats.steel, scene);
    kick.parent = leaf;
    kick.position = new Vector3(0, 0.17 - leafH / 2, faceZ);
    const win = kit.box(`door.${side}.inner.${tag}.win`, 0.22, 0.4, 0.12, glass, scene);
    win.parent = leaf;
    win.position = new Vector3(0, 1.72 - leafH / 2, 0);
  }

  const lc = kit.collider(
    `door.${side}.inner.colL`,
    w / 2,
    h,
    0.1,
    new Vector3(-w / 4, h / 2, 0),
    scene,
    doorNode,
  );
  const rc = kit.collider(
    `door.${side}.inner.colR`,
    w / 2,
    h,
    0.1,
    new Vector3(w / 4, h / 2, 0),
    scene,
    doorNode,
  );

  // wall band above/beside the inner door (corridor is wider than airlock)
  const halfGap = (LAYOUT.corridor.xHalf - w / 2) * 2;
  if (halfGap > 0) {
    for (const sx of [-1, 1]) {
      const filler = kit.box(
        `al.${side}.filler.${sx}`,
        halfGap / 2 + 0.12,
        h,
        0.12,
        mats.wallPanel,
        scene,
        al,
      );
      filler.position = new Vector3(sx * (w / 2 + halfGap / 4), h / 2, doorZ);
      colliders.push(
        kit.collider(`al.${side}.fillerCol.${sx}`, halfGap / 2, h, 0.12, filler.position.clone(), scene, al),
      );
    }
  }
  const header = kit.box(`al.${side}.header`, w + halfGap + 0.24, 0.35, 0.12, mats.wallPanel, scene, al);
  header.position = new Vector3(0, h - 0.175, doorZ);
  colliders.push(
    kit.collider(`al.${side}.headerCol`, w + halfGap, 0.35, 0.12, header.position.clone(), scene, al),
  );

  // terminal screen on the east wall of the airlock
  const term = kit.plane(`al.${side}.terminal`, 0.85, 0.42, mats.terminal, scene, al);
  term.position = new Vector3(-w / 2 + 0.07, 1.55, zc);
  term.rotation.y = Math.PI / 2;
  registry.register(`al.${side}.terminal`, term);

  // sign above inner door, facing into the corridor
  const above = kit.wallSign(
    side === "north" ? "sign.notice.board" : "sign.exit.south",
    mats,
    scene,
    al,
    registry,
    1.3,
    0.4,
  );
  above.position = new Vector3(0, h - 0.55, doorZ + (side === "north" ? 0.08 : -0.08));
  // planes' front faces point -z at y=0: the south sign must face the
  // corridor approach (north, -z => 0); the north sign faces south, +z
  above.rotation.y = side === "north" ? Math.PI : 0;

  // interior dressing — the vestibule is a room you stand inside twice per
  // loop; merge-prefixed pieces fold into the corridor's static batches.
  for (const sx of [-1, 1]) {
    const base = kit.box(`baseboard.al.${side}.${sx}`, 0.04, 0.12, z1 - z0 - 0.1, mats.rubber, scene, al);
    base.position = new Vector3((sx * (w - 0.14)) / 2, 0.06, zc);
    const ao = kit.plane(`dress.ao.al.${side}.${sx}`, z1 - z0 - 0.2, 0.4, mats.aoStrip, scene);
    ao.parent = al;
    ao.position = new Vector3((sx * (w - 0.13)) / 2, 0.24, zc);
    ao.rotation.y = sx < 0 ? -Math.PI / 2 : Math.PI / 2;
  }
  const conduit = kit.box(`dress.conduit.al.${side}`, 0.04, 0.04, z1 - z0 - 0.2, mats.steel, scene, al);
  conduit.position = new Vector3(w / 2 - 0.14, 2.62, zc);
  for (let i = 0; i < 3; i++) {
    const sz = z0 + ((z1 - z0) / 4) * (i + 1);
    const seam = kit.box(`dress.seam.al.${side}.${i}`, w - 0.15, 0.012, 0.05, mats.rubber, scene, al);
    seam.position = new Vector3(0, 0.006, sz);
  }
  const drain = kit.box(`dress.drain.al.${side}`, 0.3, 0.016, 0.5, mats.steel, scene, al);
  drain.position = new Vector3(0.6, 0.008, zc + (side === "north" ? -1.4 : 1.4));
  // bulkhead lamp over the inner door on the vestibule side
  const bulk = kit.box(`al.${side}.bulkhead`, 0.3, 0.09, 0.07, mats.trofferLit, scene, al);
  bulk.position = new Vector3(w / 2 - 0.12, 2.7, doorZ + (side === "north" ? -0.55 : 0.55));

  return {
    frame: doorNode,
    left: d.left,
    right: d.right,
    leftCollider: lc,
    rightCollider: rc,
    open01: 0,
    target01: 0,
  };
}

export function buildConcourse(
  scene: Scene,
  runSeed: string,
  opts: { reducedMotion?: boolean } = {},
): ConcourseWorld {
  const registry = new WorldRegistry();
  const dressRng = new RngStream("loop.dressing", runSeed);
  const tex = buildTextureSet(scene, dressRng, SIGNS);
  const mats = buildMaterials(scene, tex);
  kit.setFrameMaterial(mats.steel);

  const root = new TransformNode("world", scene);
  const colliders: AbstractMesh[] = [];
  const C = LAYOUT.corridor;
  const len = C.z1 - C.z0;
  const zc = (C.z0 + C.z1) / 2;

  // ─── shell ───────────────────────────────────────────────────────
  const floor = kit.box("floor", C.xHalf * 2 + 0.3, 0.1, len, mats.terrazzo, scene, root);
  floor.position = new Vector3(0, -0.05, zc);
  registry.register("floor", floor);
  colliders.push(kit.collider("floorCol", C.xHalf * 2 + 0.3, 0.1, len, floor.position.clone(), scene, root));

  const ceil = kit.box("ceiling", C.xHalf * 2 + 0.3, 0.1, len, mats.ceiling, scene, root);
  ceil.position = new Vector3(0, C.height + 0.05, zc);
  colliders.push(kit.collider("ceilCol", C.xHalf * 2 + 0.3, 0.1, len, ceil.position.clone(), scene, root));

  // ceiling tee-bar grid — the read when you look up between troffers
  for (let z = 1.2; z < C.z1; z += 1.2) {
    const bar = kit.box(
      `dress.ceilseam.${z.toFixed(1)}`,
      C.xHalf * 2 - 0.1,
      0.014,
      0.04,
      mats.rubber,
      scene,
      root,
    );
    bar.position = new Vector3(0, C.height - 0.004, z);
  }
  for (const x of [-0.6, 0.6]) {
    const rail = kit.box(`dress.ceilrail.${x}`, 0.04, 0.014, len - 0.1, mats.rubber, scene, root);
    rail.position = new Vector3(x, C.height - 0.004, zc);
  }

  // Skirting + wall caps — left wall has feature bands, right wall carries
  // the gallery glass z 20–32.
  kit.wallRun("wall.left.0", -C.xHalf, 0, 12, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.left.1", -C.xHalf, 12, 32, C.height, mats.wallPanel, scene, root, registry); // records wall face
  kit.wallRun("wall.left.2", -C.xHalf, 32, 42, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.left.3", -C.xHalf, 42, 55, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.right.0", C.xHalf, 0, 20, C.height, mats.wallPanel, scene, root, registry);
  // right wall 20–32: glass gallery
  const glass = kit.box("wall.gallery.glass", 0.06, 2.0, 12, mats.darkGlass, scene, root);
  glass.position = new Vector3(C.xHalf, 1.5, 26);
  registry.register("wall.gallery.glass", glass);
  const glassLow = kit.box("wall.gallery.low", 0.12, 0.5, 12, mats.steel, scene, root);
  glassLow.position = new Vector3(C.xHalf, 0.25, 26);
  const glassHigh = kit.box("wall.gallery.high", 0.12, 0.5, 12, mats.steel, scene, root);
  glassHigh.position = new Vector3(C.xHalf, 2.75, 26);
  // steel mullions break the 12m slab into readable window bays
  for (const mz of [20, 23, 26, 29, 32]) {
    const mullion = kit.box(`wall.gallery.mullion.${mz}`, 0.09, 2.0, 0.18, mats.steel, scene, root);
    mullion.position = new Vector3(C.xHalf, 1.5, mz);
  }
  const galleryBack = kit.box("wall.gallery.back", 0.1, 3.0, 12, mats.rubber, scene, root);
  galleryBack.position = new Vector3(C.xHalf + 1.4, 1.5, 26);
  registry.register("wall.gallery.back", galleryBack);
  kit.wallRun("wall.right.2", C.xHalf, 32, 55, C.height, mats.wallPanel, scene, root, registry);

  // continuous colliders per wall (glass section collides too)
  for (const sx of [-1, 1]) {
    colliders.push(
      kit.collider(
        `wall.col.${sx}`,
        0.12,
        C.height,
        len,
        new Vector3(sx * C.xHalf, C.height / 2, zc),
        scene,
        root,
      ),
    );
  }

  // ─── ceiling troffers (4 light zones) ─────────────────────────────
  const zones: LightZone[] = [];
  const zoneDefs = [
    { name: "entry", z0: 0, z1: 14 },
    { name: "gallery", z0: 14, z1: 32 },
    { name: "clinic", z0: 32, z1: 46 },
    { name: "junction", z0: 46, z1: 55 },
  ];
  for (let zi = 0; zi < zoneDefs.length; zi++) {
    const zd = zoneDefs[zi];
    if (!zd) continue;
    const troffers: AbstractMesh[] = [];
    const shafts: TransformNode[] = [];
    for (let z = zd.z0 + 2.5; z < zd.z1; z += 4) {
      for (const x of [-0.9, 0.9]) {
        const t = kit.troffer(
          `troffer.${zi}.${x > 0 ? "r" : "l"}.${z.toFixed(0)}`,
          mats.trofferLit,
          scene,
          root,
          registry,
        );
        t.position = new Vector3(x, C.height - 0.02, z);
        const diff = registry.mesh(t.name.replace(".frame", ""));
        troffers.push(diff);

        // crossed-plane light shaft under the fixture
        const shaftNode = new TransformNode(`shaft.${diff.name}`, scene);
        shaftNode.parent = root;
        shaftNode.position = new Vector3(x, 1.55, z);
        registry.register(shaftNode.name, shaftNode);
        for (const ry of [0, Math.PI / 2]) {
          const p = kit.plane(
            `shaft.${diff.name}.${ry === 0 ? "z" : "x"}`,
            0.85,
            2.45,
            mats.lightShaft,
            scene,
            shaftNode,
          );
          p.rotation.y = ry;
          p.billboardMode = 0;
        }
        shafts.push(shaftNode);
      }
    }
    const point = new PointLight(
      `light.zone.${zd.name}`,
      new Vector3(0, C.height - 0.25, (zd.z0 + zd.z1) / 2),
      scene,
    );
    point.diffuse = new Color3(1.0, 0.93, 0.8);
    point.intensity = 6.5;
    point.range = (zd.z1 - zd.z0) * 0.9 + 8;
    zones.push({
      name: zd.name,
      point,
      troffers,
      shafts,
      z0: zd.z0,
      z1: zd.z1,
      baseDiffuse: point.diffuse.clone(),
    });
    // lighting anomalies address zones by name through the registry
    registry.register(point.name, point as unknown as AbstractMesh);
  }

  const hemi = new HemisphericLight("light.hemi", new Vector3(0, 1, 0), scene);
  hemi.diffuse = new Color3(0.6, 0.6, 0.64);
  hemi.groundColor = new Color3(0.34, 0.32, 0.3);
  hemi.intensity = 1.05;

  // warm airlock pool lights
  for (const side of ["north", "south"] as const) {
    const az = side === "north" ? -2.5 : 57.5;
    const p = new PointLight(`light.airlock.${side}`, new Vector3(0, C.height - 0.3, az), scene);
    p.diffuse = new Color3(1.0, 0.82, 0.6);
    p.intensity = 5.5;
    p.range = 9;
    registry.register(`light.airlock.${side}`, p as unknown as AbstractMesh);
  }

  // ─── fake baked AO: base-of-wall occlusion strips ────────────────
  // (the terrazzo's own specular already pools under the fixtures —
  // explicit glow decals only double it)
  // the corridor grounds itself instead of walls meeting floor at a
  // razor edge
  for (const sx of [-1, 1]) {
    const strip = kit.plane(`dress.ao.${sx}`, 55, 0.55, mats.aoStrip, scene, root);
    strip.position = new Vector3(sx * (C.xHalf - 0.065), 0.28, 27.5);
    strip.rotation.y = sx < 0 ? -Math.PI / 2 : Math.PI / 2;
  }

  // ─── zone dressing ───────────────────────────────────────────────
  // Records wall: cabinet fronts on left z 12–32
  const cab = kit.box("records.cabinets", 0.18, 2.1, 18, mats.steel, scene, root);
  cab.position = new Vector3(-C.xHalf + 0.16, 1.15, 22);
  registry.register("records.cabinets", cab);
  // drawer grid on the bank face — the close-up read was one flat slab.
  // Merges into the static batches; anomalies overlay their own geometry.
  for (const y of [0.55, 0.95, 1.35, 1.75]) {
    const hs = kit.box(`dress.cabseam.h.${y}`, 0.014, 0.016, 17.6, mats.rubber, scene, root);
    hs.position = new Vector3(-C.xHalf + 0.255, y, 22);
  }
  for (const z of [14.6, 17.6, 20.6, 23.6, 26.6, 29.6]) {
    const vs = kit.box(`dress.cabseam.v.${z}`, 0.014, 1.5, 0.02, mats.rubber, scene, root);
    vs.position = new Vector3(-C.xHalf + 0.255, 1.15, z);
  }
  for (const z of [15.5, 18.5, 21.5, 24.5, 27.5, 30.5]) {
    const pull = kit.box(`dress.cabpull.${z}`, 0.03, 0.05, 0.24, mats.steel, scene, root);
    pull.position = new Vector3(-C.xHalf + 0.265, 1.55, z);
  }
  colliders.push(
    kit.collider("records.col", 0.3, 2.2, 18, new Vector3(-C.xHalf + 0.18, 1.1, 22), scene, root),
  );

  // Notice board + posters right wall z 6–9
  const board = kit.box("notice.board", 0.05, 1.1, 1.6, mats.rubber, scene, root);
  board.position = new Vector3(C.xHalf - 0.08, 1.7, 7);
  registry.register("notice.board", board);
  mats.poster.forEach((pm, i) => {
    const p = kit.plane(`poster.${i}`, 0.55, 0.82, pm, scene, root);
    p.position = new Vector3(-C.xHalf + 0.065, 1.75, 4.5 + i * 1.1);
    p.rotation.y = -Math.PI / 2;
    registry.register(`poster.${i}`, p);
    // recessed frame — child of the poster so poster.* anomalies carry it
    const pframe = kit.box(`poster.${i}.frame`, 0.62, 0.89, 0.025, mats.steel, scene);
    pframe.parent = p;
    pframe.position = new Vector3(0, 0, 0.013);
  });

  // Hanging totem at z=12
  const totem = kit.hangingSign("sign.totem.north", mats, scene, root, registry, C.height);
  totem.position.x = 0;
  totem.position.z = 12;

  // bench LEFT z≈16
  const bench = kit.bench(mats, scene, root, registry);
  bench.position = new Vector3(-C.xHalf + 0.45, 0, 16);
  colliders.push(
    kit.collider("bench.col", 1.9, 0.7, 0.7, new Vector3(-C.xHalf + 0.45, 0.35, 16), scene, root),
  );

  // recessed service door RIGHT z≈15.5 — baseline shut; door.ajar opens it
  const sframe = kit.box("service.door.frame", 0.14, 2.2, 1.0, mats.steel, scene, root);
  sframe.position = new Vector3(C.xHalf - 0.07, 1.1, 15.5);
  const sslit = kit.box("service.door.slit", 0.02, 2.05, 0.8, mats.rubber, scene, root);
  sslit.position = new Vector3(C.xHalf - 0.1, 1.02, 15.5);
  const sleaf = kit.box("service.door.leaf", 0.06, 2.1, 0.88, mats.door, scene, root);
  sleaf.position = new Vector3(C.xHalf - 0.12, 1.05, 15.5);
  registry.register("service.door.frame", sframe);
  registry.register("service.door.leaf", sleaf);
  registry.register("service.door.slit", sslit);
  // leaf hardware — parented so it rides door.ajar's swing
  const svcHandle = kit.box("service.door.handle", 0.045, 0.34, 0.04, mats.steel, scene);
  svcHandle.parent = sleaf;
  svcHandle.position = new Vector3(-0.055, 0.02, 0.32);
  for (const [hy, htag] of [
    [-0.55, "lo"],
    [0.45, "hi"],
  ] as const) {
    const hinge = kit.box(`service.door.hinge.${htag}`, 0.02, 0.14, 0.05, mats.steel, scene);
    hinge.parent = sleaf;
    hinge.position = new Vector3(-0.04, hy, -0.38);
  }

  // fire cabinet RIGHT z≈18
  const cabFire = kit.fireCabinet(mats, scene, root, registry);
  cabFire.position = new Vector3(C.xHalf - 0.12, 1.4, 18);

  // extinguisher on the wall beside the cabinet — the anomaly target is the
  // whole unit: bracket + cylinder + valve + hose stub
  const ext = new TransformNode("prop.extinguisher", scene);
  ext.parent = root;
  ext.position = new Vector3(C.xHalf - 0.2, 0.78, 18.55);
  const extBody = CreateCylinder("prop.ext.body", { height: 0.42, diameter: 0.13, tessellation: 14 }, scene);
  extBody.material = mats.cabinetRed;
  extBody.parent = ext;
  const extTop = CreateCylinder("prop.ext.top", { height: 0.07, diameter: 0.05, tessellation: 10 }, scene);
  extTop.material = mats.steel;
  extTop.parent = ext;
  extTop.position.y = 0.24;
  const extHose = kit.box("prop.ext.hose", 0.025, 0.18, 0.03, mats.rubber, scene, ext);
  extHose.position = new Vector3(0.045, 0.13, 0);
  const extBracket = kit.box("prop.ext.bracket", 0.04, 0.3, 0.16, mats.rubber, scene, ext);
  extBracket.position = new Vector3(0.05, 0.02, 0);
  registry.register("prop.extinguisher", ext);

  // vent grilles at the ambience anchors (high on the walls)
  const ventSpots: [number, number][] = [
    [-1, 8],
    [1, 30],
    [-1, 50],
  ];
  ventSpots.forEach(([sx, vz], i) => {
    const g = kit.box(`vent.grille.${i}`, 0.08, 0.4, 0.9, mats.steel, scene, root);
    g.position = new Vector3(sx * (C.xHalf - 0.04), C.height - 0.1, vz);
    for (let s = 0; s < 4; s++) {
      const sl = kit.box(`vent.grille.${i}.slat.${s}`, 0.03, 0.05, 0.8, mats.rubber, scene, root);
      sl.position = new Vector3(sx * (C.xHalf - 0.09), C.height - 0.24 + s * 0.1, vz);
    }
    registry.register(`vent.grille.${i}`, g);
  });

  // baseboard trim grounds the walls
  for (const sx of [-1, 1]) {
    const base = kit.box(`baseboard.${sx}`, 0.06, 0.14, len, mats.rubber, scene, root);
    base.position = new Vector3(sx * (C.xHalf - 0.03), 0.07, zc);
  }

  // continuous wainscot bumper rail — splits the big wall fields
  // horizontally like a real concourse; runs behind furniture, which
  // occludes the overlap (rail x sits inside cabinet/bench volumes)
  for (const sx of [-1, 1]) {
    const rail = kit.box(`dress.rail.${sx}`, 0.035, 0.09, len, mats.steel, scene, root);
    rail.position = new Vector3(sx * (C.xHalf - 0.018), 1.04, zc);
  }

  // pilaster pair at the service-junction mouth (z≈46) — the corridor's
  // only structural marker before the south airlock
  for (const sx of [-1, 1]) {
    const pil = kit.box(`dress.pilaster.${sx}`, 0.12, C.height, 0.2, mats.steel, scene, root);
    pil.position = new Vector3(sx * (C.xHalf - 0.06), C.height / 2, 45.9);
  }

  // vending unit — the sparse right-wall stretch z 34–46 after the
  // gallery. Registered as one node so it can anchor anomalies later.
  const vend = new TransformNode("prop.vending", scene);
  vend.parent = root;
  vend.position = new Vector3(C.xHalf - 0.36, 0, 41.5);
  const vendBody = kit.box("prop.vend.body", 0.52, 1.92, 0.95, mats.steel, scene, vend);
  vendBody.position = new Vector3(0.06, 0.96, 0);
  const vendTex = makeVendingFace(scene);
  const vendMat = new StandardMaterial("mat.vendingFace", scene);
  vendMat.diffuseTexture = vendTex;
  vendMat.emissiveTexture = vendTex;
  vendMat.emissiveColor = new Color3(0.45, 0.45, 0.45);
  vendMat.specularColor = new Color3(0.12, 0.12, 0.12);
  const vendFace = kit.plane("prop.vend.face", 0.72, 1.62, vendMat, scene, vend);
  vendFace.position = new Vector3(-0.205, 1.02, -0.06);
  vendFace.rotation.y = Math.PI / 2; // front face toward corridor (−x)
  const vendCoin = kit.box("prop.vend.coin", 0.06, 0.5, 0.18, mats.rubber, scene, vend);
  vendCoin.position = new Vector3(-0.22, 1.15, 0.34);
  const vendSlot = kit.box("prop.vend.slot", 0.065, 0.025, 0.07, mats.steel, scene, vend);
  vendSlot.position = new Vector3(-0.225, 1.22, 0.34);
  const vendKick = kit.box("prop.vend.kick", 0.54, 0.12, 0.93, mats.rubber, scene, vend);
  vendKick.position = new Vector3(0.06, 0.06, 0);
  registry.register("prop.vending", vend);
  colliders.push(
    kit.collider("prop.vend.col", 0.7, 1.95, 1.0, new Vector3(C.xHalf - 0.36, 0.98, 41.5), scene, root),
  );

  // ─── services + wear dressing ────────────────────────────────────
  // Cable tray + conduit along both ceiling edges, strap hangers,
  // junction boxes, floor expansion seams, drain grates, vent grime.
  // Baseline-fixed: these never change between loops — if they do, it's
  // an anomaly, and none registers on them.
  for (const sx of [-1, 1]) {
    const tray = kit.box(`dress.tray.${sx}`, 0.12, 0.07, len, mats.steel, scene, root);
    tray.position = new Vector3(sx * (C.xHalf - 0.28), C.height - 0.09, zc);
    const conduit = kit.box(`dress.conduit.${sx}`, 0.05, 0.05, len, mats.steel, scene, root);
    conduit.position = new Vector3(sx * (C.xHalf - 0.12), C.height - 0.05, zc);
    for (let z = 4; z < C.z1; z += 6) {
      const h = kit.box(`dress.hanger.${sx}.${z}`, 0.03, 0.09, 0.16, mats.steel, scene, root);
      h.position = new Vector3(sx * (C.xHalf - 0.28), C.height - 0.02, z);
    }
  }
  // junction boxes — left wall only inside the gallery span (right 20–32)
  const jboxSpots: [number, number][] = [
    [-1, 7],
    [1, 11],
    [-1, 16],
    [-1, 25],
    [1, 36],
    [-1, 43],
    [1, 47],
    [-1, 52],
  ];
  jboxSpots.forEach(([sx, jz], i) => {
    const jb = kit.box(`dress.jbox.${i}`, 0.09, 0.22, 0.3, mats.steel, scene, root);
    jb.position = new Vector3(sx * (C.xHalf - 0.1), 2.15, jz);
    const stub = kit.box(`dress.jstub.${i}`, 0.04, 0.55, 0.04, mats.steel, scene, root);
    stub.position = new Vector3(sx * (C.xHalf - 0.12), 2.55, jz);
  });
  // floor expansion seams across the terrazzo
  for (let z = 6; z < C.z1; z += 6) {
    const seam = kit.box(`dress.seam.${z}`, C.xHalf * 2 - 0.12, 0.012, 0.05, mats.rubber, scene, root);
    seam.position = new Vector3(0, 0.006, z);
  }
  // drain grates at the floor edges
  const drainSpots: [number, number][] = [
    [-1, 2.6],
    [1, 2.6],
    [-1, 27],
    [1, 41],
    [-1, 53],
    [1, 53],
  ];
  drainSpots.forEach(([sx, dz]) => {
    const dg = kit.box(`dress.drain.${sx}.${dz}`, 0.3, 0.016, 0.5, mats.steel, scene, root);
    dg.position = new Vector3(sx * (C.xHalf - 0.28), 0.008, dz);
  });
  // damp staining bleeding down the wall under each vent grille
  for (const [sx, vz] of ventSpots) {
    const st = kit.plane(`dress.grime.${sx}.${vz}`, 0.7, 1.15, mats.grime, scene, root);
    st.position = new Vector3(sx * (C.xHalf - 0.065), 2.05, vz);
    st.rotation.y = sx < 0 ? -Math.PI / 2 : Math.PI / 2;
  }

  // signs
  const sGallery = kit.wallSign("sign.gallery", mats, scene, root, registry, 1.5, 0.45);
  sGallery.position = new Vector3(C.xHalf - 0.08, 2.5, 26);
  // plane front face is −z: right wall (+x) needs +π/2 to face the room
  sGallery.rotation.y = Math.PI / 2;
  const sClinic = kit.wallSign("sign.clinic", mats, scene, root, registry, 1.5, 0.45);
  sClinic.position = new Vector3(-C.xHalf + 0.08, 2.5, 37);
  sClinic.rotation.y = -Math.PI / 2;
  const sJunction = kit.hangingSign("sign.junction", mats, scene, root, registry, C.height);
  sJunction.position.x = 0;
  sJunction.position.z = 45;

  // clinic shuttered counter LEFT z 35–40
  const counter = kit.box("clinic.counter", 0.6, 1.05, 4.2, mats.steel, scene, root);
  counter.position = new Vector3(-C.xHalf + 0.35, 0.525, 37);
  registry.register("clinic.counter", counter);
  colliders.push(kit.collider("clinic.counter.col", 0.7, 1.1, 4.4, counter.position.clone(), scene, root));
  const shutter = kit.box("clinic.shutter", 0.08, 1.3, 4.2, mats.shutter, scene, root);
  shutter.position = new Vector3(-C.xHalf + 0.06, 1.75, 37);
  registry.register("clinic.shutter", shutter);
  colliders.push(kit.collider("clinic.shutter.col", 0.1, 1.4, 4.4, shutter.position.clone(), scene, root));

  // master clock LEFT z=24, mounted above the records cabinets (top y=2.2)
  kit.clock(mats, scene, root, registry);
  const clockRoot = registry.get("clock.face").parent as TransformNode;
  clockRoot.position = new Vector3(-C.xHalf + 0.1, 2.52, 24);
  clockRoot.rotation.y = Math.PI / 2;

  // CCTV at four corners
  const cams: [number, number][] = [
    [-1.6, 3],
    [1.6, 20],
    [-1.6, 40],
    [1.6, 52],
  ];
  cams.forEach(([x, z], i) => {
    const cam = kit.cctv(`cctv.${i}`, mats, scene, root, registry);
    cam.position = new Vector3(x, C.height - 0.15, z);
    cam.rotation.y = z < 27 ? 0 : Math.PI;
  });

  // service junction conduits + machinery cabinet z 44–50
  for (let i = 0; i < 3; i++) {
    const pipe = kit.box(`junction.pipe.${i}`, 0.07, 0.07, 8, mats.steel, scene, root);
    pipe.position = new Vector3(-C.xHalf + 0.1, C.height - 0.4 - i * 0.12, 47);
    registry.register(`junction.pipe.${i}`, pipe);
  }
  const machine = kit.box("junction.machine", 0.8, 1.9, 1.2, mats.steel, scene, root);
  machine.position = new Vector3(-C.xHalf + 0.45, 0.95, 47.5);
  registry.register("junction.machine", machine);
  colliders.push(kit.collider("junction.machine.col", 0.9, 2.0, 1.3, machine.position.clone(), scene, root));
  const machineLamp = kit.box("junction.machine.lamp", 0.06, 0.06, 0.06, mats.trofferLit, scene, root);
  machineLamp.position = new Vector3(-C.xHalf + 0.86, 1.7, 47.2);
  registry.register("junction.machine.lamp", machineLamp);

  // ─── doorway.extra: hidden lit room behind right wall at z≈37 ────
  // Disabled in baseline; the anomaly enables it. Its doorway opening
  // overlaps a wall panel region (wall.right.2 stays solid — the anomaly
  // also swaps that panel off).
  const extraRoom = new TransformNode("anomaly.doorway.room", scene);
  extraRoom.parent = root;
  const roomZ = 37;
  const roomW = 2.6; // depth into +x
  const roomD = 3.2; // along z
  const rw = kit.box("anomaly.room.floor", roomW, 0.1, roomD, mats.concrete, scene, extraRoom);
  rw.position = new Vector3(C.xHalf + roomW / 2, -0.05, roomZ);
  const rceil = kit.box("anomaly.room.ceil", roomW, 0.1, roomD, mats.ceiling, scene, extraRoom);
  rceil.position = new Vector3(C.xHalf + roomW / 2, C.height + 0.05, roomZ);
  for (const dz of [-roomD / 2, roomD / 2]) {
    const wall = kit.box(`anomaly.room.wall.${dz}`, roomW, C.height, 0.1, mats.wallPanel, scene, extraRoom);
    wall.position = new Vector3(C.xHalf + roomW / 2, C.height / 2, roomZ + dz);
  }
  const backWall = kit.box("anomaly.room.back", 0.1, C.height, roomD, mats.anomalousRoom, scene, extraRoom);
  backWall.position = new Vector3(C.xHalf + roomW, C.height / 2, roomZ);
  // doorway frame on the corridor wall
  const dframe = new TransformNode("anomaly.doorway.frame", scene);
  dframe.parent = extraRoom;
  const doorW = 1.1;
  const post0 = kit.box("anomaly.doorway.post0", 0.14, C.height, 0.18, mats.steel, scene, dframe);
  post0.position = new Vector3(C.xHalf, C.height / 2, roomZ - doorW / 2 - 0.07);
  const post1 = kit.box("anomaly.doorway.post1", 0.14, C.height, 0.18, mats.steel, scene, dframe);
  post1.position = new Vector3(C.xHalf, C.height / 2, roomZ + doorW / 2 + 0.07);
  const lintel2 = kit.box(
    "anomaly.doorway.lintel",
    0.14,
    C.height - 2.2,
    doorW + 0.28,
    mats.steel,
    scene,
    dframe,
  );
  lintel2.position = new Vector3(C.xHalf, 2.2 + (C.height - 2.2) / 2, roomZ);
  // faint interior shelf so the room reads as "used"
  const shelf = kit.box("anomaly.room.shelf", 0.4, 1.6, 1.8, mats.steel, scene, extraRoom);
  shelf.position = new Vector3(C.xHalf + roomW - 0.25, 0.8, roomZ);
  extraRoom.setEnabled(false);

  const spill = new PointLight("anomaly.doorway.spill", new Vector3(C.xHalf - 0.6, 1.9, roomZ), scene);
  spill.diffuse = new Color3(1.0, 0.85, 0.62);
  spill.intensity = 0.0; // anomaly raises it
  spill.range = 9;

  // ─── depth.mismatch — a service door on the east wall at z≈46 opens
  // onto a gallery that recedes ~12 m into the wall (the building is
  // only so thick — the depth is impossible) ───
  const depthRoom = new TransformNode("anomaly.depth.room", scene);
  depthRoom.parent = root;
  const dRoomZ = 46;
  const dDepth = 12;
  const dW = 2.4;
  const df = kit.box("anomaly.depth.floor", dDepth, 0.1, dW, mats.concrete, scene, depthRoom);
  df.position = new Vector3(C.xHalf + dDepth / 2, -0.05, dRoomZ);
  const dc = kit.box("anomaly.depth.ceil", dDepth, 0.1, dW, mats.ceiling, scene, depthRoom);
  dc.position = new Vector3(C.xHalf + dDepth / 2, C.height + 0.05, dRoomZ);
  for (const dz of [-dW / 2, dW / 2]) {
    const w = kit.box(`anomaly.depth.wall.${dz}`, dDepth, C.height, 0.1, mats.wallPanel, scene, depthRoom);
    w.position = new Vector3(C.xHalf + dDepth / 2, C.height / 2, dRoomZ + dz);
  }
  // receding pilaster ribs — the depth rhythm that sells the distance
  for (let i = 1; i <= 3; i++) {
    for (const dz of [-dW / 2 + 0.12, dW / 2 - 0.12]) {
      const rib = kit.box(`anomaly.depth.rib.${i}.${dz}`, 0.18, C.height, 0.24, mats.steel, scene, depthRoom);
      rib.position = new Vector3(C.xHalf + i * 3, C.height / 2, dRoomZ + dz);
    }
  }
  // far end: a lit doorway silhouette — the room resolves as "somewhere else"
  const dBack = kit.box("anomaly.depth.back", 0.1, C.height, dW, mats.wallPanel, scene, depthRoom);
  dBack.position = new Vector3(C.xHalf + dDepth, C.height / 2, dRoomZ);
  const dFar = kit.box("anomaly.depth.fardoor", 0.06, 2.2, 1.0, mats.trofferDim, scene, depthRoom);
  dFar.position = new Vector3(C.xHalf + dDepth - 0.08, 1.1, dRoomZ);
  const dGlow = new PointLight(
    "anomaly.depth.farglow",
    new Vector3(C.xHalf + dDepth - 0.5, 1.8, dRoomZ),
    scene,
  );
  dGlow.diffuse = new Color3(1.0, 0.8, 0.55);
  dGlow.intensity = 2.4;
  dGlow.range = 10;
  depthRoom.setEnabled(false);

  const depthSpill = new PointLight("anomaly.depth.spill", new Vector3(C.xHalf - 0.6, 1.9, dRoomZ), scene);
  depthSpill.diffuse = new Color3(1.0, 0.85, 0.62);
  depthSpill.intensity = 0.0;
  depthSpill.range = 9;

  // dust motes drifting through the troffer light — one additive
  // particle system filling the corridor volume; skipped entirely when
  // the player asks for reduced motion
  if (!opts.reducedMotion) {
    const dotTex = new DynamicTexture("tex.dustdot", { width: 32, height: 32 }, scene, false);
    const dctx = dotTex.getContext() as unknown as CanvasRenderingContext2D;
    const dg = dctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    dg.addColorStop(0, "rgba(255,250,235,0.9)");
    dg.addColorStop(0.5, "rgba(255,250,235,0.25)");
    dg.addColorStop(1, "rgba(255,250,235,0)");
    dctx.fillStyle = dg;
    dctx.fillRect(0, 0, 32, 32);
    dotTex.update();
    const dust = new ParticleSystem("fx.dust", 400, scene);
    dust.particleTexture = dotTex;
    dust.emitter = new Vector3(0, 0, 0);
    dust.createBoxEmitter(
      new Vector3(-0.015, 0.012, -0.015),
      new Vector3(0.015, 0.045, 0.015),
      new Vector3(-C.xHalf + 0.2, 0.35, 0),
      new Vector3(C.xHalf - 0.2, C.height - 0.2, 55),
    );
    dust.emitRate = 30;
    dust.minLifeTime = 6;
    dust.maxLifeTime = 12;
    dust.minSize = 0.006;
    dust.maxSize = 0.02;
    dust.color1 = new Color4(1, 0.96, 0.86, 0.16);
    dust.color2 = new Color4(0.9, 0.88, 0.8, 0.1);
    dust.colorDead = new Color4(1, 1, 1, 0);
    dust.blendMode = ParticleSystem.BLENDMODE_ADD;
    dust.gravity = Vector3.Zero();
    dust.start();
  }

  // condensation patch on the glass gallery (footsteps.extra visual cue)
  const condensation = kit.plane("anomaly.condensation", 1.6, 1.6, mats.condensation, scene, root);
  condensation.position = new Vector3(C.xHalf - 0.04, 1.6, 26);
  condensation.rotation.y = -Math.PI / 2;
  condensation.isVisible = false;
  registry.register("anomaly.condensation", condensation);

  // ─── airlocks ────────────────────────────────────────────────────
  const northDoor = buildAirlock("north", scene, mats, registry, root, colliders);
  const southDoor = buildAirlock("south", scene, mats, registry, root, colliders);

  // corridor end caps so you can't slip past the airlock frames
  for (const z of [0, 55]) {
    const headerTop = kit.box(`endcap.${z}`, C.xHalf * 2 + 0.24, 0.35, 0.14, mats.wallPanel, scene, root);
    headerTop.position = new Vector3(0, C.height - 0.175, z);
  }

  const scatter = buildScatter(scene, root, mats, runSeed, registry);
  const ambientWalker = buildAmbientWalker(scene, root, mats, registry);
  ambientWalker.reset();
  buildFixtures(scene, root, mats, registry);
  mergeStaticDressing(root);

  return {
    root,
    registry,
    materials: mats,
    textures: tex,
    colliders,
    doors: { northInner: northDoor, southInner: southDoor },
    zones,
    hemi,
    extraRoom,
    extraRoomSpill: spill,
    depthRoom,
    depthSpill,
    condensationPatch: condensation,
    scatter,
    ambientWalker,
    clock: {
      hourPivot: registry.get("clock.hour.pivot") as TransformNode,
      minutePivot: registry.get("clock.minute.pivot") as TransformNode,
      face: registry.mesh("clock.face"),
    },
    anchors: {
      clock: new Vector3(-C.xHalf + 0.1, 2.52, 24),
      junctionMachine: new Vector3(-C.xHalf + 0.45, 1.4, 47.5),
      vents: [new Vector3(-1.7, 2.9, 8), new Vector3(1.7, 2.9, 30), new Vector3(-1.7, 2.9, 50)],
      troffers: [new Vector3(0, 2.95, 12), new Vector3(0, 2.95, 28), new Vector3(0, 2.95, 45)],
    },
  };
}
