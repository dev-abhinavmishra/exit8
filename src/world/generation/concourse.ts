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
import { PointsCloudSystem } from "@babylonjs/core/Particles/pointsCloudSystem";
import { Constants } from "@babylonjs/core/Engines/constants";
import type { CloudPoint } from "@babylonjs/core/Particles/cloudPoint";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { WorldRegistry } from "../registry";
import { buildMaterials, type MaterialSet } from "../materials/library";
import {
  buildEnvironmentTexture,
  buildTextureSet,
  drawNote,
  makeFasciaBand,
  makePhoneFace,
  makeVendingFace,
  type TextureSet,
} from "./textures";
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
  /** extra lights inside the zone's footprint (e.g. the machinery bay's
   *  bulkhead lamp) — every zone-dim path scales these with `point` */
  extraLights: PointLight[];
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
    /** wall-mounted PA horn positions for the muffled announcements */
    paHorns: Vector3[];
    /** vending unit face — compressor-hum emitter point */
    vend: Vector3;
  };
  /** per-loop harmless scatter — refreshed on every rebaseline */
  scatter: ScatterPool;
  /** the baseline inspector figure — reset every rebaseline */
  ambientWalker: AmbientWalker;
  /** junction-machine extraction-fan speed (0..1+); anomalies throttle
   *  it — machine.silence ties it to observation, blackout kills it */
  fanSpeed: number;
  /** per-frame world tics that aren't anomaly-owned: the fan rotor */
  update(dt: number): void;
  /** drifting dust motes — null under reduced motion; the blackout
   *  stills the air so the dark holds nothing moving */
  dust: ParticleSystem | null;
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

let _paperMat: StandardMaterial | null = null;
/** Xerox-paper notice sheets — a shared CWA memo texture, legible dim. */
function paperMaterial(scene: Scene): StandardMaterial {
  if (_paperMat) return _paperMat;
  const t = new DynamicTexture("tex.noticeSheet", { width: 192, height: 256 }, scene, true);
  drawNote(t, {
    title: "NIGHT ROTA — W/C 7",
    lines: [
      "SURVEY LOOP 7: 22:00–06:00",
      "FILE AT BOTH POINTS",
      "LOG ALL DIVERGENCES",
      "GALLERY: NO ENTRY",
      "LIFT S-2: OUT OF SERVICE",
      "REPORT TO DESK 4",
    ],
  });
  _paperMat = new StandardMaterial("mat.paper", scene);
  _paperMat.diffuseTexture = t;
  _paperMat.emissiveTexture = t;
  _paperMat.emissiveColor = new Color3(0.35, 0.35, 0.33); // readable in dim zones
  _paperMat.specularColor = new Color3(0.02, 0.02, 0.02);
  return _paperMat;
}

let _doorGlassMat: StandardMaterial | null = null;
function doorGlassMaterial(scene: Scene): StandardMaterial {
  if (_doorGlassMat) return _doorGlassMat;
  _doorGlassMat = new StandardMaterial("mat.doorGlass", scene);
  _doorGlassMat.diffuseColor = new Color3(0.05, 0.066, 0.078);
  // low specular — the panes otherwise catch a white slab of glare that
  // reads as a lit window from any distance
  _doorGlassMat.specularColor = new Color3(0.06, 0.07, 0.08);
  _doorGlassMat.emissiveColor = new Color3(0.008, 0.012, 0.016);
  // wired panes are translucent — the dressed, lit vestibule reads
  // dimly through the glass so the doors have real depth
  _doorGlassMat.alpha = 0.42;
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
  if (side === "south") {
    // pass counter — repainted each loop; sits on the commit-side cap
    // face where you read it walking up to file "route clear"
    const attemptMat = mats.sign.get("sign.attempt");
    if (!attemptMat) throw new Error("missing sign material: sign.attempt");
    const attempt = kit.plane(`al.${side}.cap.attempt`, 0.7, 0.22, attemptMat, scene);
    attempt.parent = cap;
    attempt.position = new Vector3(0, 1.55 - h / 2, capFace);
    attempt.rotation.y = capRot;
    // corridor-side counter — beside the south mouth where you read it
    // walking up to file; shares the repainted material so the two
    // plates can never disagree (cap-side one is only seen open)
    const face = kit.plane(`al.${side}.cap.attempt.face`, 0.46, 0.15, attemptMat, scene);
    face.parent = root;
    face.position = new Vector3(-1.54, 1.72, 54.93);
    registry.register("sign.attempt.face", face);
    const faceBez = kit.box(`dress.passbez.${side}`, 0.5, 0.19, 0.015, mats.steel, scene, root);
    faceBez.position = new Vector3(-1.54, 1.72, 54.945);
    // the same count at the north mouth — one shared texture, so the
    // plates can never disagree (the north cap plate only shows open)
    const faceN = kit.plane("al.north.cap.attempt.face", 0.46, 0.15, attemptMat, scene);
    faceN.parent = root;
    faceN.position = new Vector3(-1.54, 1.72, 1.0);
    faceN.rotation.y = Math.PI;
    registry.register("sign.attempt.face.n", faceN);
    const bezN = kit.box("dress.passbez.n", 0.5, 0.19, 0.015, mats.steel, scene, root);
    bezN.position = new Vector3(-1.54, 1.72, 1.015);
  }
  for (const [bx, btag] of [
    [-w / 2 + 0.16, "l"],
    [w / 2 - 0.16, "r"],
  ] as const) {
    const bolt = kit.box(`al.${side}.cap.bolt.${btag}`, 0.04, 0.04, 0.02, mats.rubber, scene);
    bolt.parent = cap;
    bolt.position = new Vector3(bx, 2.32 - h / 2, capFace);
  }

  // ribbed runner mat just inside the inner door — the entrance detail
  // every service vestibule has
  const matZ = side === "north" ? z1 - 0.9 : z0 + 0.9;
  const rmat = kit.box(`dress.floormat.${side}`, w - 0.4, 0.02, 1.5, mats.rubber, scene, al);
  rmat.position = new Vector3(0, 0.012, matZ);

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
    // wired glass — the faint criss-cross laminate inside safety panes
    for (const [mx, mtag] of [
      [-0.06, "l"],
      [0.06, "r"],
    ] as const) {
      const mesh = kit.box(
        `door.${side}.inner.${tag}.winmesh.v.${mtag}`,
        0.006,
        0.38,
        0.004,
        mats.rubber,
        scene,
      );
      mesh.parent = leaf;
      mesh.position = new Vector3(mx, 1.72 - leafH / 2, faceZ);
    }
    const meshH = kit.box(`door.${side}.inner.${tag}.winmesh.h`, 0.2, 0.006, 0.004, mats.rubber, scene);
    meshH.parent = leaf;
    meshH.position = new Vector3(0, 1.72 - leafH / 2, faceZ);
  }
  // overhead guide track the leaves ride — the rail line above the
  // doorway is what sells these as sliding doors
  const track = kit.box(`door.${side}.track`, w, 0.06, 0.1, mats.steel, scene);
  track.parent = doorNode;
  track.position = new Vector3(0, leafH + 0.04, 0);

  // airlock status dome over the mouth — shifts amber→teal with the
  // door cycle (driven from loopManager's door-slide block); reads as
  // the "doors are live" cue from the corridor
  const domeMat = new StandardMaterial(`mat.statusdome.${side}`, scene);
  domeMat.disableLighting = true;
  domeMat.emissiveColor = new Color3(1.0, 0.55, 0.15);
  const domeHousing = kit.box(`al.${side}.statusdome.housing`, 0.16, 0.12, 0.05, mats.steel, scene);
  domeHousing.parent = doorNode;
  domeHousing.position = new Vector3(0, leafH + 0.16, faceZ * 0.6);
  const statusDome = kit.box(`al.${side}.statusdome`, 0.11, 0.085, 0.045, domeMat, scene);
  statusDome.parent = doorNode;
  statusDome.position = new Vector3(0, leafH + 0.15, faceZ * 0.6 + (faceZ > 0 ? 0.024 : -0.024));
  registry.register(`al.${side}.statusdome`, statusDome);

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

  // terminal screen on the east wall of the airlock — a mounted monitor:
  // steel housing + bezel lip behind the screen, status LED below.
  // Housing is NOT a terminal child so terminal.black darks only the screen.
  const housing = kit.box(`dress.term.${side}.housing`, 0.05, 0.52, 0.95, mats.steel, scene, al);
  housing.position = new Vector3(-w / 2 + 0.04, 1.55, zc);
  const led = kit.box(`dress.term.${side}.led`, 0.02, 0.02, 0.05, mats.trofferLit, scene, al);
  led.position = new Vector3(-w / 2 + 0.07, 1.28, zc + 0.36);
  const term = kit.plane(`al.${side}.terminal`, 0.85, 0.42, mats.terminal, scene, al);
  term.position = new Vector3(-w / 2 + 0.07, 1.55, zc);
  // west airlock wall faces +x into the vestibule — plane front (−z)
  // needs −π/2 to face the room (was +π/2: the screen faced the wall)
  term.rotation.y = -Math.PI / 2;
  registry.register(`al.${side}.terminal`, term);

  // sign above inner door, facing into the corridor — the two commit
  // ends read as a designed pair: FILE ROUTE CLEAR south, FILE
  // DIVERGENCE north, arrows mirroring each other
  const above = kit.wallSign(
    side === "north" ? "sign.diverge.north" : "sign.exit.south",
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
    // wall panel joints — the vestibule walls read as flat slabs
    // without them; three seams per wall
    for (let i = 0; i < 3; i++) {
      const wz = z0 + ((z1 - z0) / 4) * (i + 1);
      const ws = kit.box(`dress.wseam.al.${side}.${sx}.${i}`, 0.014, 2.2, 0.03, mats.rubber, scene, al);
      ws.position = new Vector3((sx * (w - 0.17)) / 2, 1.2, wz);
    }
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
  // dome camera watching the vestibule — stem + tinted hemisphere
  const domeStem = kit.box(`dress.dome.${side}.stem`, 0.03, 0.1, 0.03, mats.steel, scene, al);
  domeStem.position = new Vector3(-w / 2 + 0.3, h - 0.05, zc + (side === "north" ? -1.0 : 1.0));
  const dome = CreateSphere(`dress.dome.${side}.ball`, { diameter: 0.16, segments: 8 }, scene);
  dome.material = mats.rubber;
  dome.parent = al;
  dome.scaling.y = 0.6;
  dome.position = new Vector3(-w / 2 + 0.3, h - 0.14, zc + (side === "north" ? -1.0 : 1.0));

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
  // procedural IBL — without it every environmentIntensity is a no-op
  // and metals go black anywhere the point lights don't reach
  scene.environmentTexture = buildEnvironmentTexture(scene);
  kit.setFrameMaterial(mats.steel);

  const root = new TransformNode("world", scene);
  const colliders: AbstractMesh[] = [];
  const C = LAYOUT.corridor;
  const len = C.z1 - C.z0;
  const zc = (C.z0 + C.z1) / 2;

  // S-2 machinery bay — a real recess in the west wall, z 46.2–49.4,
  // 1.15 m deep. Every wall run / trim strip / collider that used to
  // cross this stretch splits around the mouth.
  const BAY_Z0 = 46.2;
  const BAY_Z1 = 49.4;
  const BAY_DEPTH = 1.15;
  const BAY_ZC = (BAY_Z0 + BAY_Z1) / 2;

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
  // wall.left.3 ends at the S-2 machinery bay mouth (z 46.2–49.4, a real
  // recess — see the bay block below); wall.left.4 resumes past it
  kit.wallRun("wall.left.3", -C.xHalf, 42, 46.2, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.left.4", -C.xHalf, 49.4, 55, C.height, mats.wallPanel, scene, root, registry);
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
  // venetian blinds drawn down over one bay — the only bay you can't
  // read the room through; child of the glass so gallery anomalies
  // carry it
  const blind = kit.plane("wall.gallery.blind", 2.8, 1.9, mats.blinds, scene);
  blind.parent = glass;
  blind.position = new Vector3(0.08, 0, -1.5);
  blind.rotation.y = -Math.PI / 2;
  registry.register("wall.gallery.blind", blind);
  const galleryBack = kit.box("wall.gallery.back", 0.1, 3.0, 12, mats.rubber, scene, root);
  galleryBack.position = new Vector3(C.xHalf + 1.4, 1.5, 26);
  // baseline reading-room interior behind the smoked glass — dark
  // furniture silhouettes + one lit cove line inside the visible band
  const galFloor = kit.box("dress.gal.floor", 1.35, 0.08, 12, mats.concrete, scene, root);
  galFloor.position = new Vector3(C.xHalf + 0.75, -0.02, 26);
  const galCeil = kit.box("dress.gal.ceil", 1.35, 0.08, 12, mats.ceiling, scene, root);
  galCeil.position = new Vector3(C.xHalf + 0.75, C.height + 0.02, 26);
  for (const dz of [-6, 6]) {
    const gside = kit.box(`dress.gal.side.${dz}`, 1.35, C.height, 0.1, mats.wallPanel, scene, root);
    gside.position = new Vector3(C.xHalf + 0.75, C.height / 2, 26 + dz);
  }
  for (const cz of [22, 24.5, 29.5]) {
    const gcab = kit.box(`dress.gal.cab.${cz}`, 0.32, 1.9, 1.5, mats.steel, scene, root);
    gcab.position = new Vector3(C.xHalf + 1.15, 0.95, cz);
  }
  for (const dz of [22.5, 26.5, 30]) {
    const desk = kit.box(`dress.gal.desk.${dz}`, 0.55, 0.74, 1.5, mats.steel, scene, root);
    desk.position = new Vector3(C.xHalf + 0.72, 0.37, dz);
    const chair = kit.box(`dress.gal.chair.${dz}`, 0.35, 0.85, 0.4, mats.rubber, scene, root);
    chair.position = new Vector3(C.xHalf + 1.12, 0.42, dz + 0.3);
  }
  // lit cove at the back — inside the glass band (y 0.5–2.5), the line
  // that makes the room read as occupied space, not void
  const gcove = kit.box("dress.gal.cove", 0.06, 0.05, 11.4, mats.trofferLit, scene, root);
  gcove.position = new Vector3(C.xHalf + 1.3, 2.36, 26);
  // one desk carries a lit monitor face toward the glass — the
  // occupied-room cue at walking distance
  const gmon = kit.box("dress.gal.monitor", 0.02, 0.26, 0.38, mats.trofferLit, scene, root);
  gmon.position = new Vector3(C.xHalf + 0.46, 0.88, 26.5);
  // a warm desk lamp left on — a point of light deeper in the room
  // than the monitor, reads through the dark panes as depth
  const glamp = kit.box("dress.gal.lamp", 0.05, 0.06, 0.05, mats.trofferLit, scene, root);
  glamp.position = new Vector3(C.xHalf + 0.52, 0.82, 24.2);
  registry.register("wall.gallery.cove", gcove);
  registry.register("wall.gallery.monitor", gmon);
  registry.register("wall.gallery.lamp", glamp);
  registry.register("wall.gallery.back", galleryBack);
  kit.wallRun("wall.right.2", C.xHalf, 32, 55, C.height, mats.wallPanel, scene, root, registry);

  // continuous colliders per wall (glass section collides too); the west
  // wall splits around the S-2 bay mouth (z 46.2–49.4) so you can walk in
  for (const sx of [-1, 1]) {
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [[C.z0, C.z1]];
    spans.forEach(([s0, s1], i) => {
      colliders.push(
        kit.collider(
          `wall.col.${sx}.${i}`,
          0.12,
          C.height,
          s1 - s0,
          new Vector3(sx * C.xHalf, C.height / 2, (s0 + s1) / 2),
          scene,
          root,
        ),
      );
    });
  }

  // ─── ceiling troffers (4 light zones) ─────────────────────────────
  const zones: LightZone[] = [];
  const zoneDefs = [
    { name: "entry", z0: 0, z1: 14, tint: [1.0, 0.95, 0.85] as const },
    { name: "gallery", z0: 14, z1: 32, tint: [1.0, 0.94, 0.83] as const },
    // the clinic stretch runs a touch cooler — fluorescent wing off a
    // service intake reads institutional, not warm
    { name: "clinic", z0: 32, z1: 46, tint: [0.96, 0.97, 0.9] as const },
    { name: "junction", z0: 46, z1: 55, tint: [1.0, 0.93, 0.8] as const },
  ];
  const moteAnchors: { x: number; z: number; zi: number }[] = [];
  for (let zi = 0; zi < zoneDefs.length; zi++) {
    const zd = zoneDefs[zi];
    if (!zd) continue;
    const troffers: AbstractMesh[] = [];
    const shafts: TransformNode[] = [];
    for (let z = zd.z0 + 2.5; z < zd.z1; z += 4) {
      for (const x of [-0.9, 0.9]) {
        moteAnchors.push({ x, z, zi });
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
    point.diffuse = new Color3(zd.tint[0], zd.tint[1], zd.tint[2]);
    point.intensity = 7.6;
    point.range = (zd.z1 - zd.z0) * 0.9 + 8;
    zones.push({
      name: zd.name,
      point,
      troffers,
      shafts,
      z0: zd.z0,
      z1: zd.z1,
      baseDiffuse: point.diffuse.clone(),
      extraLights: [],
    });
    // lighting anomalies address zones by name through the registry
    registry.register(point.name, point as unknown as AbstractMesh);
  }

  // ─── S-2 machinery bay — a real recess in the west wall ───────────
  // The junction sign promises a service space; now it's walkable. The
  // extraction machine sits inside on service concrete, pipes run the
  // bay's back and drop into it, and a caged bulkhead lamp burns over
  // the works. Shell meshes are junction.bay.* (static merge); colliders
  // make the mouth a real doorway.
  {
    const bayW = BAY_Z1 - BAY_Z0;
    const backFace = -C.xHalf - BAY_DEPTH; // interior back face
    // wall continues over the mouth — header + a steel lintel edge so
    // the opening reads as a finished service aperture, not a void
    const bayHeader = kit.box("junction.bay.header", 0.12, 0.7, bayW + 0.24, mats.wallPanel, scene, root);
    bayHeader.position = new Vector3(-C.xHalf, C.height - 0.35, BAY_ZC);
    const bayLintel = kit.box("junction.bay.lintel", 0.06, 0.08, bayW + 0.26, mats.steel, scene, root);
    bayLintel.position = new Vector3(-C.xHalf + 0.06, C.height - 0.72, BAY_ZC);
    colliders.push(
      kit.collider(
        "junction.bay.headerCol",
        0.14,
        0.72,
        bayW + 0.24,
        bayHeader.position.clone(),
        scene,
        root,
      ),
    );
    // concrete cheeks + back — service-bay material break from the
    // corridor's panel walls
    for (const bz of [BAY_Z0, BAY_Z1]) {
      const cheek = kit.box(
        `junction.bay.cheek.${bz}`,
        BAY_DEPTH + 0.12,
        C.height,
        0.12,
        mats.concrete,
        scene,
        root,
      );
      cheek.position = new Vector3(-C.xHalf - BAY_DEPTH / 2, C.height / 2, bz);
      colliders.push(
        kit.collider(
          `junction.bay.cheekCol.${bz}`,
          BAY_DEPTH + 0.14,
          C.height,
          0.14,
          cheek.position.clone(),
          scene,
          root,
        ),
      );
    }
    const bayBack = kit.box("junction.bay.back", 0.12, C.height, bayW + 0.24, mats.concrete, scene, root);
    bayBack.position = new Vector3(backFace - 0.06, C.height / 2, BAY_ZC);
    colliders.push(
      kit.collider(
        "junction.bay.backCol",
        0.14,
        C.height,
        bayW + 0.24,
        bayBack.position.clone(),
        scene,
        root,
      ),
    );
    const bayCeil = kit.box(
      "junction.bay.ceil",
      BAY_DEPTH + 0.3,
      0.1,
      bayW + 0.24,
      mats.ceiling,
      scene,
      root,
    );
    bayCeil.position = new Vector3(-C.xHalf - BAY_DEPTH / 2, C.height + 0.05, BAY_ZC);
    const bayFloor = kit.box(
      "junction.bay.floor",
      BAY_DEPTH + 0.3,
      0.1,
      bayW + 0.24,
      mats.concrete,
      scene,
      root,
    );
    bayFloor.position = new Vector3(-C.xHalf - BAY_DEPTH / 2, -0.05, BAY_ZC);
    colliders.push(
      kit.collider(
        "junction.bay.floorCol",
        BAY_DEPTH + 0.3,
        0.1,
        bayW + 0.24,
        bayFloor.position.clone(),
        scene,
        root,
      ),
    );
    // worn steel threshold across the mouth
    const baySill = kit.box("dress.threshold.bay", 0.07, 0.012, bayW + 0.2, mats.steel, scene, root);
    baySill.position = new Vector3(-C.xHalf + 0.05, 0.006, BAY_ZC);
    // baseboards wrap INTO the bay — a real opening trims its cheeks
    for (const bz of [BAY_Z0 + 0.06, BAY_Z1 - 0.06]) {
      const skirt = kit.box(
        `junction.bay.skirt.${bz}`,
        BAY_DEPTH - 0.06,
        0.14,
        0.06,
        mats.rubber,
        scene,
        root,
      );
      skirt.position = new Vector3(-C.xHalf - BAY_DEPTH / 2, 0.07, bz);
    }
    const bayBackSkirt = kit.box("junction.bay.skirtBack", 0.06, 0.14, bayW - 0.2, mats.rubber, scene, root);
    bayBackSkirt.position = new Vector3(backFace - 0.02, 0.07, BAY_ZC);
    // caged bulkhead lamp high on the back wall — self-lit so it burns
    // in the bay's shade; rides the junction zone's kills/dips via
    // troffers (material swap) + extraLights (intensity scale)
    const cageLamp = kit.box("junction.bay.cage", 0.2, 0.12, 0.12, mats.rubber, scene, root);
    cageLamp.position = new Vector3(backFace + 0.1, 2.35, BAY_Z1 - 0.32);
    const cageGlass = kit.box("junction.baylamp", 0.05, 0.09, 0.16, mats.trofferLit, scene, root);
    cageGlass.position = new Vector3(backFace + 0.16, 2.35, BAY_Z1 - 0.32);
    for (const cy of [-0.03, 0.03]) {
      const bar = kit.box(`junction.bay.cagebar.${cy}`, 0.17, 0.012, 0.012, mats.rubber, scene, root);
      bar.position = new Vector3(backFace + 0.13, 2.35 + cy, BAY_Z1 - 0.32);
    }
    const bayLight = new PointLight("light.bay", new Vector3(-C.xHalf - 0.35, 2.3, BAY_ZC), scene);
    bayLight.diffuse = new Color3(1.0, 0.88, 0.7);
    bayLight.intensity = 4.6;
    bayLight.range = 6;
    const junctionZone = zones.find((z) => z.name === "junction");
    if (junctionZone) {
      junctionZone.extraLights.push(bayLight);
      junctionZone.troffers.push(cageGlass);
    }
    registry.register("light.bay", bayLight as unknown as AbstractMesh);
    registry.register("junction.baylamp", cageGlass);
    // valve wheel + pressure gauge cluster on the back wall beside the
    // machine — the bay reads as a working service space
    const valve = CreateCylinder(
      "junction.bay.valve",
      { height: 0.03, diameter: 0.16, tessellation: 12 },
      scene,
    );
    valve.material = mats.cabinetRed;
    valve.rotation.z = Math.PI / 2;
    valve.position = new Vector3(backFace + 0.08, 1.5, BAY_Z0 + 0.5);
    for (let sp = 0; sp < 4; sp++) {
      const spoke = kit.box(`junction.bay.valvespoke.${sp}`, 0.012, 0.14, 0.012, mats.rubber, scene, root);
      spoke.position = new Vector3(backFace + 0.09, 1.5, BAY_Z0 + 0.5);
      spoke.rotation.x = (sp * Math.PI) / 4;
    }
    const bayGauge = CreateCylinder(
      "junction.bay.gauge",
      { height: 0.03, diameter: 0.11, tessellation: 12 },
      scene,
    );
    bayGauge.material = mats.trofferLit;
    bayGauge.rotation.z = Math.PI / 2;
    bayGauge.position = new Vector3(backFace + 0.08, 1.72, BAY_Z0 + 0.5);
    // bay stencil — S-2 stenciled on the back wall in worn paint
    const stencilTex = new DynamicTexture("tex.bayStencil", { width: 256, height: 128 }, scene, true);
    {
      const c = stencilTex.getContext() as unknown as CanvasRenderingContext2D;
      c.clearRect(0, 0, 256, 128);
      c.font = "bold 92px monospace";
      c.fillStyle = "rgba(205,200,185,0.82)";
      c.textAlign = "center";
      c.fillText("S-2", 128, 96);
      stencilTex.update();
    }
    const stencilMat = new StandardMaterial("mat.bayStencil", scene);
    stencilMat.diffuseTexture = stencilTex;
    stencilMat.emissiveTexture = stencilTex;
    stencilMat.emissiveColor = new Color3(0.25, 0.25, 0.23);
    stencilMat.opacityTexture = stencilTex;
    stencilMat.disableLighting = true;
    const stencilPlane = kit.plane("junction.bay.stencil", 0.7, 0.35, stencilMat, scene);
    stencilPlane.position = new Vector3(backFace + 0.02, 2.0, BAY_Z0 + 0.7);
    stencilPlane.rotation.y = Math.PI / 2;
    stencilPlane.parent = root;
    // floor drain at the bay's low edge — service bays drain
    const bayDrain = kit.box("dress.drain.bay", 0.3, 0.008, 0.3, mats.rubber, scene, root);
    bayDrain.position = new Vector3(-C.xHalf - BAY_DEPTH / 2, 0.005, BAY_ZC);
    // motes drifting in the bay lamp's pool — junction zone index
    moteAnchors.push({ x: -C.xHalf - BAY_DEPTH / 2, z: BAY_Z0 + 0.7, zi: 3 });
    moteAnchors.push({ x: -C.xHalf - BAY_DEPTH / 2, z: BAY_Z0 + 0.7, zi: 3 });
  }

  // ─── dust motes hanging in the light shafts ───────────────────────
  // one PointsCloudSystem for the whole corridor — a single draw call.
  // groupID carries the zone index so a killed or browned-out zone's
  // motes dim with its lamps; reduced motion stills the drift.
  const motePcs = new PointsCloudSystem("motes", 2.8, scene);
  for (const a of moteAnchors) {
    for (let i = 0; i < 9; i++) {
      motePcs.addPoints(1, (p: CloudPoint) => {
        const rr = 0.06 + dressRng.draw() * 0.4;
        const th = dressRng.draw() * Math.PI * 2;
        p.position.set(
          a.x + Math.cos(th) * rr,
          0.45 + dressRng.draw() * 2.15,
          a.z + Math.sin(th) * rr * 0.55,
        );
        p.groupId = a.zi;
        const w = 0.62 + dressRng.draw() * 0.38;
        p.color = new Color4(w, w * 0.93, w * 0.74, 1);
      });
    }
  }
  const moteBases: number[] = [];
  void motePcs.buildMeshAsync().then(() => {
    const mm = motePcs.mesh?.material;
    if (mm instanceof StandardMaterial) {
      mm.emissiveColor = Color3.White();
      mm.alphaMode = Constants.ALPHA_ADD;
      mm.disableLighting = true;
    }
    for (const p of motePcs.particles) {
      moteBases.push(p.position.x, p.position.y, p.position.z);
    }
  });
  const moteAmp = opts.reducedMotion === true ? 0 : 1;
  let motesT = 0;
  scene.onBeforeRenderObservable.add(() => {
    motesT += scene.getEngine().getDeltaTime() / 1000;
  });
  motePcs.updateParticle = (p) => {
    const zone = zones[p.groupId];
    const lit = zone ? Math.min(1, zone.point.intensity / 7.6) : 0;
    const w = (0.66 + (p.idx % 5) * 0.08) * lit;
    p.color?.set(w, w * 0.93, w * 0.74, 1);
    const bi = p.idx * 3;
    if (moteAmp === 0 || moteBases[bi] === undefined) return p;
    p.position.x = moteBases[bi]! + Math.sin(motesT * 0.31 + p.idx * 1.93) * 0.055;
    p.position.y = moteBases[bi + 1]! + Math.sin(motesT * 0.16 + p.idx * 0.71) * 0.1;
    p.position.z = moteBases[bi + 2]! + Math.cos(motesT * 0.24 + p.idx * 2.31) * 0.055;
    return p;
  };

  const hemi = new HemisphericLight("light.hemi", new Vector3(0, 1, 0), scene);
  hemi.diffuse = new Color3(0.66, 0.66, 0.7);
  hemi.groundColor = new Color3(0.36, 0.34, 0.32);
  hemi.intensity = 1.14;

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
    // the west strip splits around the bay mouth so no wash floats
    // across the opening at floor level
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [[C.z0, C.z1]];
    spans.forEach(([s0, s1], i) => {
      const strip = kit.plane(`dress.ao.${sx}${i ? ".s" : ""}`, s1 - s0, 0.55, mats.aoStrip, scene, root);
      strip.position = new Vector3(sx * (C.xHalf - 0.065), 0.28, (s0 + s1) / 2);
      strip.rotation.y = sx < 0 ? -Math.PI / 2 : Math.PI / 2;
    });
  }

  // dark terrazzo border band along each wall base — station-floor
  // framing, and it grounds the AO strips
  for (const sx of [-1, 1]) {
    const border = kit.plane(`dress.fborder.${sx}`, 0.36, 55, mats.rubber, scene, root);
    border.position = new Vector3(sx * (C.xHalf - 0.25), 0.009, 27.5);
    border.rotation.x = -Math.PI / 2;
  }
  // expansion joints across the floor — terrazzo slab seams give the
  // eye a scale ruler down-corridor
  for (let i = 0; i < 7; i++) {
    const fz = 4.6 + i * 7.4;
    const seam = kit.box(`dress.floorseam.${fz.toFixed(1)}`, 3.4, 0.006, 0.028, mats.rubber, scene, root);
    seam.position = new Vector3(0, 0.007, fz);
  }
  // walk-path wear: a faint grime wash where inspectors track feet —
  // subtle, no hard edges
  const wear = kit.plane("dress.floorwear", 1.1, 44, mats.grime, scene, root);
  wear.position = new Vector3(0.05, 0.008, 26);
  wear.rotation.x = -Math.PI / 2;

  // ─── zone dressing ───────────────────────────────────────────────
  // Records wall: cabinet fronts on left z 12–32
  // pale panel reads as enamelled steel; true steel rendered the
  // eighteen-metre bank as a near-black void in this light
  const cab = kit.box("records.cabinets", 0.18, 2.1, 18, mats.wallPanel, scene, root);
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
  // pulls + label cards on every drawer row — a real card bank reads
  // as a grid of pale label windows, not a slab with dark ticks
  const cardMat = new StandardMaterial("mat.cardlabel", scene);
  cardMat.diffuseColor = new Color3(0.78, 0.74, 0.64);
  cardMat.specularColor = new Color3(0.06, 0.06, 0.06);
  for (const py of [0.24, 0.66, 1.06, 1.46]) {
    for (const z of [15.5, 18.5, 21.5, 24.5, 27.5, 30.5]) {
      const pull = kit.box(`dress.cabpull.${py}.${z}`, 0.04, 0.055, 0.24, mats.steel, scene, root);
      pull.position = new Vector3(-C.xHalf + 0.275, py, z);
      const lbl = kit.box(`dress.cablabel.${py}.${z}`, 0.018, 0.09, 0.18, cardMat, scene, root);
      lbl.position = new Vector3(-C.xHalf + 0.26, py + 0.15, z);
    }
  }
  // ARCHIVES fascia — the institutional label band across the bank's
  // upper face, like the printed stock headers on real archive walls
  const fasciaTex = makeFasciaBand(scene);
  const fasciaMat = new StandardMaterial("mat.fascia", scene);
  fasciaMat.diffuseTexture = fasciaTex;
  fasciaMat.emissiveColor = new Color3(0.12, 0.11, 0.08);
  fasciaMat.specularColor = new Color3(0.15, 0.15, 0.15);
  const fascia = kit.plane("dress.cabfascia", 17.6, 0.17, fasciaMat, scene, root);
  fascia.position = new Vector3(-C.xHalf + 0.262, 2.0, 22);
  fascia.rotation.y = -Math.PI / 2;
  colliders.push(
    kit.collider("records.col", 0.3, 2.2, 18, new Vector3(-C.xHalf + 0.18, 1.1, 22), scene, root),
  );

  // Notice board + posters right wall z 6–9
  const board = kit.box("notice.board", 0.05, 1.1, 1.6, mats.rubber, scene, root);
  board.position = new Vector3(C.xHalf - 0.08, 1.7, 7);
  registry.register("notice.board", board);
  // pinned notices — children of the board so notice.* anomalies carry
  // them. Local −x is the corridor face.
  const papers: [number, number, number][] = [
    [-0.28, 0.32, 0.03],
    [0.18, 0.28, -0.02],
    [-0.05, -0.1, 0.02],
    [0.35, -0.18, -0.03],
    [-0.38, -0.25, 0.05],
  ];
  papers.forEach(([pz, py, tilt], i) => {
    const sheet = kit.plane(`notice.sheet.${i}`, 0.24, 0.32, paperMaterial(scene), scene);
    sheet.parent = board;
    sheet.position = new Vector3(-0.028, py, pz);
    sheet.rotation.y = Math.PI / 2; // front face toward corridor (−x)
    sheet.rotation.z = tilt;
  });
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

  // Hanging totems — the wayfinding rhythm: ARCHIVES over the records
  // bank, INSPECTION LOOP 7 over the mid-route
  const totem = kit.hangingSign("sign.totem.north", mats, scene, root, registry, C.height);
  totem.position.x = 0;
  totem.position.z = 12;
  const totemMid = kit.hangingSign("sign.totem.mid", mats, scene, root, registry, C.height);
  totemMid.position.x = 0;
  totemMid.position.z = 38;

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
  const svcPush = kit.box("service.door.push", 0.02, 0.3, 0.18, mats.steel, scene);
  svcPush.parent = sleaf;
  svcPush.position = new Vector3(-0.04, 0, 0.1);
  const svcKick = kit.box("service.door.kick", 0.02, 0.24, 0.78, mats.steel, scene);
  svcKick.parent = sleaf;
  svcKick.position = new Vector3(-0.04, -0.78, 0);
  const svcPlaque = kit.plane("service.door.plaque", 0.3, 0.1, paperMaterial(scene), scene);
  svcPlaque.parent = sleaf;
  svcPlaque.position = new Vector3(-0.033, 0.35, 0);
  svcPlaque.rotation.y = Math.PI / 2;

  // fire cabinet RIGHT z≈18
  const cabFire = kit.fireCabinet(mats, scene, root, registry);
  cabFire.position = new Vector3(C.xHalf - 0.12, 1.4, 18);

  // wall phone niche RIGHT z≈13.2 — the dead corridor handset between
  // the directory and the service door
  const phone = new TransformNode("prop.phone", scene);
  phone.parent = root;
  phone.position = new Vector3(C.xHalf - 0.05, 1.45, 13.2);
  registry.register("prop.phone", phone);
  const pBack = kit.box("prop.phone.back", 0.07, 0.52, 0.34, mats.steel, scene);
  pBack.parent = phone;
  const pFace = kit.box("prop.phone.face", 0.05, 0.42, 0.26, mats.rubber, scene);
  pFace.parent = phone;
  pFace.position = new Vector3(-0.045, -0.02, 0);
  // drawn face plate: cradle, dial card, keypad, LINE lamp
  const phoneMat = new StandardMaterial("mat.phoneFace", scene);
  phoneMat.diffuseTexture = makePhoneFace(scene);
  phoneMat.specularColor = Color3.Black();
  phoneMat.emissiveColor = new Color3(0.07, 0.07, 0.07);
  const pPlate = kit.plane("prop.phone.plate", 0.24, 0.4, phoneMat, scene);
  pPlate.parent = phone;
  pPlate.position = new Vector3(-0.071, -0.02, 0);
  pPlate.rotation.y = Math.PI / 2; // corridor side is local −x
  const handset = kit.box("prop.phone.handset", 0.045, 0.2, 0.05, mats.rubber, scene);
  handset.parent = phone;
  handset.position = new Vector3(-0.075, 0.06, -0.1);
  const cord = kit.box("prop.phone.cord", 0.012, 0.3, 0.012, mats.rubber, scene);
  cord.parent = phone;
  cord.position = new Vector3(-0.06, -0.18, -0.06);
  const pLamp = kit.box("prop.phone.lamp", 0.02, 0.03, 0.03, mats.trofferDim, scene);
  pLamp.parent = phone;
  pLamp.position = new Vector3(-0.075, 0.21, 0.1);

  // drinking fountain RIGHT z≈37.5 — wall-hung stainless basin by the
  // clinic zone
  const fountain = new TransformNode("prop.fountain", scene);
  fountain.parent = root;
  fountain.position = new Vector3(C.xHalf - 0.16, 0.85, 37.5);
  registry.register("prop.fountain", fountain);
  // pale panel reads as stainless in the junction's weak reflections —
  // true steel goes near-black here (same lesson as the lift doors)
  const fBack = kit.box("prop.fountain.back", 0.08, 0.62, 0.42, mats.wallPanel, scene);
  fBack.parent = fountain;
  fBack.position = new Vector3(0.05, 0.31, 0);
  const fBasin = kit.box("prop.fountain.basin", 0.34, 0.14, 0.44, mats.wallPanel, scene);
  fBasin.parent = fountain;
  fBasin.position = new Vector3(-0.14, 0, 0);
  const fRim = kit.box("prop.fountain.rim", 0.36, 0.025, 0.46, mats.rubber, scene);
  fRim.parent = fountain;
  fRim.position = new Vector3(-0.14, 0.082, 0);
  const bubbler = CreateCylinder(
    "prop.fountain.bubbler",
    { height: 0.05, diameter: 0.035, tessellation: 10 },
    scene,
  );
  bubbler.material = mats.rubber;
  bubbler.parent = fountain;
  bubbler.position = new Vector3(-0.02, 0.12, -0.12);
  // dark basin well inside the rim + a drain dot
  const fWell = kit.box("prop.fountain.well", 0.24, 0.02, 0.32, mats.rubber, scene);
  fWell.parent = fountain;
  fWell.position = new Vector3(-0.14, 0.08, 0);
  const fDrain = CreateCylinder(
    "prop.fountain.drain",
    { height: 0.012, diameter: 0.05, tessellation: 10 },
    scene,
  );
  fDrain.material = mats.steel;
  fDrain.parent = fountain;
  fDrain.position = new Vector3(-0.14, 0.095, 0.08);
  // splash lip at the back edge
  const fLip = kit.box("prop.fountain.lip", 0.34, 0.05, 0.02, mats.steel, scene);
  fLip.parent = fountain;
  fLip.position = new Vector3(-0.14, 0.11, -0.21);
  const fButton = kit.box("prop.fountain.btn", 0.03, 0.03, 0.06, mats.rubber, scene);
  fButton.parent = fountain;
  fButton.position = new Vector3(-0.14, 0.02, 0.24);
  colliders.push(
    kit.collider("prop.fountain.col", 0.42, 0.75, 0.5, new Vector3(C.xHalf - 0.18, 0.75, 37.5), scene, root),
  );

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

  // baseboard trim grounds the walls — west splits around the bay mouth
  for (const sx of [-1, 1]) {
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [[C.z0, C.z1]];
    spans.forEach(([s0, s1], i) => {
      const base = kit.box(`baseboard.${sx}${i ? ".s" : ""}`, 0.06, 0.14, s1 - s0, mats.rubber, scene, root);
      base.position = new Vector3(sx * (C.xHalf - 0.03), 0.07, (s0 + s1) / 2);
    });
  }

  // continuous wainscot bumper rail — splits the big wall fields
  // horizontally like a real concourse; runs behind furniture, which
  // occludes the overlap (rail x sits inside cabinet/bench volumes)
  for (const sx of [-1, 1]) {
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [[C.z0, C.z1]];
    spans.forEach(([s0, s1], i) => {
      const rail = kit.box(`dress.rail.${sx}${i ? ".s" : ""}`, 0.035, 0.09, s1 - s0, mats.steel, scene, root);
      rail.position = new Vector3(sx * (C.xHalf - 0.018), 1.04, (s0 + s1) / 2);
    });
  }

  // pilaster pair at the service-junction mouth (z≈46) — the corridor's
  // only structural marker before the south airlock
  for (const sx of [-1, 1]) {
    const pil = kit.box(`dress.pilaster.${sx}`, 0.12, C.height, 0.2, mats.steel, scene, root);
    pil.position = new Vector3(sx * (C.xHalf - 0.06), C.height / 2, 45.9);
    // impact corner guard on the traffic-facing edge
    const guard = kit.plane(`dress.pilaster.guard.${sx}`, 0.1, 1.0, hazardBandMaterial(scene), scene, root);
    guard.position = new Vector3(sx * (C.xHalf - 0.06), 0.82, 45.79);
  }

  // steel architrave around each airlock mouth — the frame the sliding
  // door sits inside, seen from the corridor side
  for (const [tag, fz] of [
    ["n", 0.02],
    ["s", 54.98],
  ] as const) {
    for (const fx of [-1.24, 1.24]) {
      const jamb = kit.box(
        `dress.dframe.${tag}.${fx < 0 ? "l" : "r"}`,
        0.07,
        2.72,
        0.06,
        mats.steel,
        scene,
        root,
      );
      jamb.position = new Vector3(fx, 1.34, fz);
    }
    const head = kit.box(`dress.dframe.${tag}.hdr`, 2.56, 0.16, 0.06, mats.steel, scene, root);
    head.position = new Vector3(0, 2.76, fz);
  }

  // sprinkler drops — stem + head every ~6 m, alternating lanes
  for (let i = 0; i < 9; i++) {
    const sz = 4 + i * 6;
    const sx = i % 2 === 0 ? -1.15 : 1.15;
    const stem = kit.box(`dress.sprinkler.${i}.stem`, 0.02, 0.22, 0.02, mats.steel, scene, root);
    stem.position = new Vector3(sx, C.height - 0.11, sz);
    const head = CreateCylinder(
      `dress.sprinkler.${i}.head`,
      { height: 0.025, diameter: 0.07, tessellation: 10 },
      scene,
    );
    head.material = mats.steel;
    head.parent = root;
    head.position = new Vector3(sx, C.height - 0.23, sz);
  }

  // door thresholds — worn brass strip under each airlock door line
  for (const [tz, tag] of [
    [0, "n"],
    [55, "s"],
  ] as const) {
    const th = kit.box(`dress.threshold.${tag}`, 3.56, 0.012, 0.1, mats.steel, scene, root);
    th.position = new Vector3(0, 0.008, tz);
  }

  // tactile warning pads — truncated-dome field on the corridor side of
  // each door line, where the guide strip ends
  for (const [pz, tag] of [
    [0.62, "n"],
    [54.38, "s"],
  ] as const) {
    const pad = kit.plane(`dress.tactile.${tag}`, 3.0, 0.46, mats.domePad, scene, root);
    pad.position = new Vector3(0, 0.006, pz);
    pad.rotation.x = Math.PI / 2;
  }

  // fire-alarm call points — the small red boxes every institutional
  // corridor hangs at shoulder height
  for (const [sx, pz] of [
    [-1, 43.4],
    [1, 8.5],
    [1, 48.6],
  ] as const) {
    const cp = kit.box(`dress.callpoint.${pz}`, 0.05, 0.14, 0.1, mats.cabinetRed, scene, root);
    cp.position = new Vector3(sx * (C.xHalf - 0.05), 1.38, pz);
    const tab = kit.box(`dress.callpoint.${pz}.tab`, 0.012, 0.06, 0.05, mats.trofferLit, scene, root);
    tab.position = new Vector3(sx * (C.xHalf - 0.082), 1.38, pz);
  }

  // emergency light units — twin-lamp boxes high on the walls, always
  // a dead warm glass (the corridor runs on the troffers)
  for (const [sx, pz] of [
    [-1, 7.5],
    [-1, 33.2],
    [1, 50.0],
  ] as const) {
    const el = kit.box(`dress.emlight.${pz}`, 0.07, 0.11, 0.3, mats.steel, scene, root);
    el.position = new Vector3(sx * (C.xHalf - 0.05), 2.62, pz);
    for (const dz of [-0.09, 0.09]) {
      const lamp = kit.box(
        `dress.emlight.${pz}.lamp${dz < 0 ? "a" : "b"}`,
        0.04,
        0.06,
        0.06,
        mats.trofferDim,
        scene,
        root,
      );
      lamp.position = new Vector3(sx * (C.xHalf - 0.09), 2.62, pz + dz);
      // anomalies address the lamps (a dead feed wakes them)
      registry.register(lamp.name, lamp);
    }
  }

  // maintenance access hatches — recessed steel panels flush with the
  // wall skin, with a quarter-turn keyhole slot
  for (const [sx, pz] of [
    [-1, 2.6],
    [1, 34.4],
    [-1, 51.4],
  ] as const) {
    const h = kit.box(`dress.hatch.${pz}`, 0.03, 0.72, 0.52, mats.steel, scene, root);
    h.position = new Vector3(sx * (C.xHalf - 0.025), 1.3, pz);
    const slot = kit.box(`dress.hatch.${pz}.slot`, 0.014, 0.05, 0.014, mats.rubber, scene, root);
    slot.position = new Vector3(sx * (C.xHalf - 0.045), 1.3, pz + 0.18);
  }

  // damp staining — dark washes bleeding down from the ceiling line in
  // the oldest stretches of the route
  for (const [sx, pz, w] of [
    [-1, 10.4, 0.9],
    [1, 46.2, 0.9],
    [-1, 41.5, 0.7],
  ] as const) {
    const st = kit.plane(`dress.stain.${pz}`, w, 1.5, mats.grime, scene, root);
    st.position = new Vector3(sx * (C.xHalf - 0.065), 1.9, pz);
    st.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
  }

  // wall-mounted route directory on the quiet stretch past the notices
  const dir = kit.wallSign("sign.directory", mats, scene, root, registry, 1.3, 0.34);
  dir.position = new Vector3(C.xHalf - 0.06, 1.86, 10.9);
  dir.rotation.y = Math.PI / 2;

  // lit green evacuation-route sign high on the west wall, pointing the
  // way to the south inspection point — the only green on the route
  const exitRoute = kit.wallSign("sign.exitroute", mats, scene, root, registry, 0.7, 0.24);
  exitRoute.position = new Vector3(-C.xHalf + 0.06, 2.1, 53.2);
  exitRoute.rotation.y = -Math.PI / 2;

  // PA horns — wall-mounted flared speakers high at each end of the run
  for (const [sx, pz, dirZ] of [
    [1, 12.2, 1],
    [-1, 40.5, -1],
  ] as const) {
    const base = kit.box(`dress.pahorn.${pz}`, 0.06, 0.16, 0.14, mats.steel, scene, root);
    base.position = new Vector3(sx * (C.xHalf - 0.05), 2.5, pz);
    const horn = CreateCylinder(
      `dress.pahorn.${pz}.cone`,
      { height: 0.18, diameterTop: 0.17, diameterBottom: 0.05, tessellation: 12 },
      scene,
    );
    horn.material = mats.rubber;
    horn.position = new Vector3(sx * (C.xHalf - 0.05), 2.5, pz + dirZ * 0.12);
    horn.rotation.x = dirZ > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  // caution A-frame — the folding wet-floor sign left out mid-route
  const cautionMat = new StandardMaterial("mat.caution", scene);
  cautionMat.diffuseColor = new Color3(0.72, 0.5, 0.08);
  cautionMat.emissiveColor = new Color3(0.16, 0.12, 0.03);
  cautionMat.specularColor = new Color3(0.08, 0.08, 0.08);
  const caution = new TransformNode("dress.caution", scene);
  caution.parent = root;
  caution.position = new Vector3(0.95, 0, 30.8);
  caution.rotation.y = 0.22;
  for (const lean of [-1, 1]) {
    const panel = kit.box(`dress.caution.panel${lean < 0 ? "a" : "b"}`, 0.36, 0.54, 0.018, cautionMat, scene);
    panel.parent = caution;
    panel.position = new Vector3(0, 0.27, lean * 0.088);
    panel.rotation.x = -lean * 0.32;
    const band = kit.box(`dress.caution.band${lean < 0 ? "a" : "b"}`, 0.28, 0.09, 0.012, mats.rubber, scene);
    band.parent = panel;
    band.position = new Vector3(0, 0.1, lean * 0.018);
  }
  const hinge = kit.box("dress.caution.hinge", 0.38, 0.05, 0.05, mats.rubber, scene);
  hinge.parent = caution;
  hinge.position = new Vector3(0, 0.56, 0);

  // scuff wear — dark shoe-sheen marks ground into the terrazzo at the
  // two places everyone stands: inside each airlock door and at the
  // commit stripes
  const scuffSpots: [number, number, number][] = [
    [0.5, 0.9, 0.3],
    [-0.6, 1.1, -0.25],
    [0.4, 56.2, -0.2],
    [-0.5, 57.5, 0.35],
    [0.7, 54.2, 0.15],
    [-0.4, 0.6, -0.3],
  ];
  scuffSpots.forEach(([sx, sz, sr], i) => {
    const sc = kit.plane(`dress.scuff.${i}`, 0.9, 0.35, mats.grime, scene, root);
    sc.position = new Vector3(sx, 0.014, sz);
    sc.rotation.x = Math.PI / 2; // face up
    sc.rotation.z = sr;
  });

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
    // west tray + conduit gap at the bay mouth — the services branch
    // into the bay instead of floating across the opening
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [[C.z0, C.z1]];
    spans.forEach(([s0, s1], i) => {
      const tray = kit.box(`dress.tray.${sx}${i ? ".s" : ""}`, 0.12, 0.07, s1 - s0, mats.steel, scene, root);
      tray.position = new Vector3(sx * (C.xHalf - 0.28), C.height - 0.09, (s0 + s1) / 2);
      const conduit = kit.box(
        `dress.conduit.${sx}${i ? ".s" : ""}`,
        0.05,
        0.05,
        s1 - s0,
        mats.steel,
        scene,
        root,
      );
      conduit.position = new Vector3(sx * (C.xHalf - 0.12), C.height - 0.05, (s0 + s1) / 2);
    });
    for (let z = 4; z < C.z1; z += 6) {
      if (sx < 0 && z > BAY_Z0 - 0.5 && z < BAY_Z1 + 0.5) continue; // no hanger floats over the mouth
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
  // damp spread around the south drain — what the drain is there for
  const puddle = kit.plane("dress.puddle.0", 0.95, 0.7, mats.puddle, scene, root);
  puddle.position = new Vector3(1.35, 0.007, 52.6);
  puddle.rotation.x = Math.PI / 2;

  // pilot lamps beside each airlock mouth — the amber "route open"
  // indicator you learn to glance at before committing
  for (const [tag, fz, dir] of [
    ["n", 0.03, 1],
    ["s", 54.97, -1],
  ] as const) {
    const housing = kit.box(`dress.doorlight.${tag}`, 0.08, 0.2, 0.1, mats.steel, scene, root);
    housing.position = new Vector3(1.5, 1.95, fz);
    // south lamp registered (not merged): pilot.dead kills it
    const lampName = tag === "s" ? "pilot.south" : `dress.doorlight.${tag}.lamp`;
    const lamp = kit.box(lampName, 0.04, 0.12, 0.05, mats.commitmentStripe, scene, root);
    lamp.position = new Vector3(1.5, 1.95, fz + dir * 0.07);
    if (tag === "s") registry.register("pilot.south", lamp);
  }

  // ceiling void panel — one missing tile exposes the dark plenum with
  // a dangling service cable
  const void_ = kit.box("dress.ceilvoid", 0.85, 0.05, 1.15, mats.rubber, scene, root);
  void_.position = new Vector3(-0.9, C.height - 0.06, 22.5);
  const cable = kit.box("dress.ceilvoid.cable", 0.018, 0.42, 0.018, mats.rubber, scene, root);
  cable.position = new Vector3(-0.82, C.height - 0.28, 22.3);
  const jbox = kit.box("dress.ceilvoid.jbox", 0.16, 0.1, 0.14, mats.steel, scene, root);
  jbox.position = new Vector3(-0.72, C.height - 0.12, 22.66);
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
  // safety placard further along the clinic stretch — fills the bare
  // panel field between the clinic sign and the junction pilasters
  const sSafety = kit.wallSign("sign.safety", mats, scene, root, registry, 0.85, 0.28);
  sSafety.position = new Vector3(-C.xHalf + 0.06, 1.82, 41.5);
  sSafety.rotation.y = -Math.PI / 2;
  const sJunction = kit.hangingSign("sign.junction", mats, scene, root, registry, C.height);
  sJunction.position.x = 0;
  sJunction.position.z = 45;
  // route branding at the entry — the stretch before the notice board
  const sIntake = kit.wallSign("sign.intake", mats, scene, root, registry, 1.3, 0.4);
  sIntake.position = new Vector3(C.xHalf - 0.08, 2.3, 3.0);
  sIntake.rotation.y = Math.PI / 2;
  // ceiling cove — a soft dark line where wall meets ceiling on both
  // runs, so the junction reads as a finished edge not a hard seam
  for (const sx of [-1, 1]) {
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [[C.z0, C.z1]];
    spans.forEach(([s0, s1], i) => {
      const cove = kit.plane(`dress.cove.${sx}${i ? ".s" : ""}`, s1 - s0, 0.14, mats.aoStrip, scene, root);
      cove.position = new Vector3(sx * (C.xHalf - 0.03), 2.93, (s0 + s1) / 2);
      cove.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      cove.rotation.z = Math.PI; // solid edge up at the ceiling line
    });
  }

  // clinic shuttered counter LEFT z 35–40
  const counter = kit.box("clinic.counter", 0.6, 1.05, 4.2, mats.steel, scene, root);
  counter.position = new Vector3(-C.xHalf + 0.35, 0.525, 37);
  registry.register("clinic.counter", counter);
  colliders.push(kit.collider("clinic.counter.col", 0.7, 1.1, 4.4, counter.position.clone(), scene, root));
  const shutter = kit.box("clinic.shutter", 0.08, 1.3, 4.2, mats.shutter, scene, root);
  shutter.position = new Vector3(-C.xHalf + 0.06, 1.75, 37);
  registry.register("clinic.shutter", shutter);
  colliders.push(kit.collider("clinic.shutter.col", 0.1, 1.4, 4.4, shutter.position.clone(), scene, root));
  // counter dressing — children of the counter so clinic anomalies ride
  const ctop = kit.box("clinic.counter.top", 0.66, 0.035, 4.3, mats.rubber, scene);
  ctop.parent = counter;
  ctop.position = new Vector3(0, 0.54, 0);
  const ckick = kit.box("clinic.counter.kick", 0.02, 0.12, 4.1, mats.rubber, scene);
  ckick.parent = counter;
  ckick.position = new Vector3(0.295, -0.45, 0);
  const tray = kit.box("clinic.counter.tray", 0.24, 0.05, 0.34, mats.rubber, scene);
  tray.parent = counter;
  tray.position = new Vector3(0.12, 0.56, -1.3);
  for (let si = 0; si < 2; si++) {
    const sheet = kit.plane(`clinic.counter.sheet.${si}`, 0.18, 0.24, paperMaterial(scene), scene);
    sheet.parent = counter;
    sheet.position = new Vector3(0.12 + si * 0.01, 0.585 + si * 0.004, -1.3);
    sheet.rotation.x = -Math.PI / 2;
    sheet.rotation.z = si * 0.4 - 0.2;
  }
  const bell = CreateCylinder(
    "clinic.counter.bell",
    { height: 0.05, diameterTop: 0.045, diameterBottom: 0.07, tessellation: 12 },
    scene,
  );
  bell.material = mats.steel;
  bell.parent = counter;
  bell.position = new Vector3(0.15, 0.59, 0.9);
  // shutter hardware — bottom lock band + center lock case + wicket slot
  const lockband = kit.box("clinic.shutter.lockband", 0.02, 0.14, 4.2, mats.rubber, scene);
  lockband.parent = shutter;
  lockband.position = new Vector3(0.045, -0.58, 0);
  const lock = kit.box("clinic.shutter.lock", 0.03, 0.1, 0.14, mats.rubber, scene);
  lock.parent = shutter;
  lock.position = new Vector3(0.045, -0.5, 0);
  const wicket = kit.box("clinic.shutter.wicket", 0.02, 0.28, 0.55, mats.rubber, scene);
  wicket.parent = shutter;
  wicket.position = new Vector3(0.045, -0.45, -0.8);
  // a typed notice taped to the shutter glass above the wicket —
  // "INTAKE B — CLOSED 22:00–06:00" as a plain paper sheet
  const sNote = kit.plane("clinic.shutter.note", 0.2, 0.26, paperMaterial(scene), scene);
  sNote.parent = shutter;
  sNote.position = new Vector3(0.048, 0.18, -0.8);
  sNote.rotation.y = -Math.PI / 2;
  const sTape = kit.box("clinic.shutter.tape", 0.01, 0.03, 0.1, mats.steel, scene);
  sTape.parent = shutter;
  sTape.position = new Vector3(0.045, 0.32, -0.8);

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

  // service junction conduits — the pipe run now lives INSIDE the bay
  // along its back wall instead of crossing the mouth in mid-air
  for (let i = 0; i < 3; i++) {
    const pipe = kit.box(`junction.pipe.${i}`, 0.07, 0.07, 2.9, mats.steel, scene, root);
    pipe.position = new Vector3(-C.xHalf - BAY_DEPTH + 0.1, C.height - 0.4 - i * 0.12, BAY_ZC);
    registry.register(`junction.pipe.${i}`, pipe);
  }
  // vertical risers drop the bay's ceiling run into the machine +
  // one full-height stack past the bank — junction.pipe.* merges
  for (let i = 0; i < 2; i++) {
    const riser = kit.box(`junction.pipe.r${i}`, 0.06, 0.9, 0.06, mats.steel, scene, root);
    riser.position = new Vector3(-C.xHalf - BAY_DEPTH + 0.35, 2.05, BAY_ZC - 0.3 + i * 0.6);
  }
  const stack = kit.box("junction.pipe.stack", 0.09, 2.7, 0.09, mats.steel, scene, root);
  stack.position = new Vector3(-C.xHalf + 0.12, 1.35, 44.3);
  const stackBase = kit.box("junction.pipe.stackbase", 0.16, 0.3, 0.16, mats.rubber, scene, root);
  stackBase.position = new Vector3(-C.xHalf + 0.12, 0.15, 44.3);
  // the extraction machine sits INSIDE the bay, centred on it — its
  // dressed face still reads to the corridor, and it no longer eats
  // a chunk of the walkway
  const machine = kit.box("junction.machine", 0.6, 1.9, 1.2, mats.wallPanel, scene, root);
  machine.position = new Vector3(-C.xHalf - BAY_DEPTH + 0.38, 0.95, BAY_ZC);
  registry.register("junction.machine", machine);
  colliders.push(kit.collider("junction.machine.col", 0.7, 2.0, 1.3, machine.position.clone(), scene, root));
  const machineLamp = kit.box("junction.machine.lamp", 0.06, 0.06, 0.06, mats.trofferLit, scene, root);
  machineLamp.position = new Vector3(-C.xHalf - BAY_DEPTH + 0.71, 1.78, BAY_ZC - 0.3);
  registry.register("junction.machine.lamp", machineLamp);
  // machine face detail — gauge dial, vent slats, access seam (children
  // of the cabinet so they ride any anomaly that moves it)
  const gauge = CreateCylinder(
    "junction.machine.gauge",
    { height: 0.03, diameter: 0.16, tessellation: 14 },
    scene,
  );
  gauge.parent = machine;
  gauge.rotation.z = Math.PI / 2;
  gauge.position = new Vector3(0.41, 0.55, -0.2);
  const gaugeFace = CreateCylinder(
    "junction.machine.dial",
    { height: 0.035, diameter: 0.12, tessellation: 14 },
    scene,
  );
  gaugeFace.material = mats.trofferLit;
  gaugeFace.parent = machine;
  gaugeFace.rotation.z = Math.PI / 2;
  gaugeFace.position = new Vector3(0.41, 0.55, -0.2);
  for (let i = 0; i < 4; i++) {
    const vent = kit.box(`junction.machine.vent.${i}`, 0.02, 0.03, 0.7, mats.rubber, scene);
    vent.parent = machine;
    vent.position = new Vector3(0.41, -0.45 - i * 0.08, 0);
  }
  // control strip — three status lamps in a row + maker's plate, so the
  // corridor face reads as equipment, not a slab
  const lampRow = [mats.cabinetRed, mats.guideStrip, mats.trofferDim];
  lampRow.forEach((lm, i) => {
    const lamp = kit.box(`junction.machine.swl.${i}`, 0.025, 0.03, 0.03, lm, scene);
    lamp.parent = machine;
    lamp.position = new Vector3(0.41, 0.78, -0.3 + i * 0.12);
  });
  const plate = kit.box("junction.machine.plate", 0.015, 0.14, 0.4, mats.wallPanel, scene);
  plate.parent = machine;
  plate.position = new Vector3(0.41, 0.2, 0.1);
  // extraction fan — the machine's one moving part: a dark circular
  // opening, a 4-blade rotor turning behind grille bars. Anomalies
  // throttle it through world.fanSpeed (machine.silence spins it only
  // while observed, blackout kills it with the feed)
  const fanOpen = CreateCylinder(
    "junction.machine.fanopen",
    { height: 0.02, diameter: 0.3, tessellation: 20 },
    scene,
  );
  fanOpen.material = mats.rubber;
  fanOpen.parent = machine;
  fanOpen.rotation.z = Math.PI / 2;
  fanOpen.position = new Vector3(0.405, -0.12, 0);
  const fanRotor = new TransformNode("junction.machine.fan", scene);
  fanRotor.parent = machine;
  fanRotor.position = new Vector3(0.415, -0.12, 0);
  registry.register("junction.machine.fan", fanRotor);
  // two crossed blades through the hub — four tips spinning in the
  // grille's plane (rotation.x is the spin axis)
  for (const [a, stag] of [
    [0, "a"],
    [Math.PI / 2, "b"],
  ] as const) {
    const blade = kit.box(`junction.machine.fanblade.${stag}`, 0.008, 0.24, 0.045, mats.wallPanel, scene);
    blade.parent = fanRotor;
    blade.rotation.x = a;
  }
  const fanHub = CreateCylinder(
    "junction.machine.fanhub",
    { height: 0.03, diameter: 0.07, tessellation: 12 },
    scene,
  );
  fanHub.material = mats.rubber;
  fanHub.parent = fanRotor;
  fanHub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const bar = kit.box(`junction.machine.fanbar.${i}`, 0.008, 0.012, 0.28, mats.wallPanel, scene);
    bar.parent = machine;
    bar.position = new Vector3(0.435, -0.12 + (i - 1) * 0.09, 0);
  }
  for (const [fy, stag] of [
    [0.06, "t"],
    [-0.3, "b"],
  ] as const) {
    const rim = kit.box(`junction.machine.fanrim.${stag}`, 0.008, 0.03, 0.34, mats.wallPanel, scene);
    rim.parent = machine;
    rim.position = new Vector3(0.43, -0.12 + fy, 0);
  }
  // top conduit stubs — it feeds upward into the tray run
  for (const [sz, stag] of [
    [-0.3, "a"],
    [0.25, "b"],
  ] as const) {
    const stub = kit.box(`junction.machine.stub.${stag}`, 0.05, 0.75, 0.05, mats.steel, scene);
    stub.parent = machine;
    stub.position = new Vector3(0.2, 1.3, sz);
  }

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
  let dust: ParticleSystem | null = null;
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
    dust = new ParticleSystem("fx.dust", 400, scene);
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
    dust,
    fanSpeed: 1,
    update(dt: number): void {
      const rotor = registry.get("junction.machine.fan");
      rotor.rotation.x += dt * 7.5 * this.fanSpeed;
    },
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
      paHorns: [new Vector3(C.xHalf - 0.05, 2.5, 12.2), new Vector3(-C.xHalf + 0.05, 2.5, 40.5)],
      vend: new Vector3(C.xHalf - 0.36, 1.1, 41.5),
    },
  };
}
