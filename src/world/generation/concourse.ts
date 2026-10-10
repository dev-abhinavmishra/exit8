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
import type { Material } from "@babylonjs/core/Materials/material";
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
  /** clinic.staffed prebuilt intake room behind the shuttered counter */
  clinicAlcove: TransformNode;
  clinicLamp: PointLight;
  /** service.stairwell prebuilt stair throat behind the service door */
  serviceStair: TransformNode;
  serviceStairLamp: PointLight;
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
  // sealed staff door on a side wall — the vestibule reads as a junction,
  // not a box; alternating sides so the two airlocks don't mirror
  const dsx = side === "north" ? -1 : 1;
  const dframe = kit.box(`dress.sdoor.${side}.frame`, 0.05, 2.14, 0.94, mats.steel, scene, al);
  dframe.position = new Vector3((dsx * (w - 0.1)) / 2, 1.07, zc + 0.7);
  const dpanel = kit.plane(`sdoor.${side}.panel`, 0.84, 2.04, mats.wallPanel, scene);
  dpanel.parent = al;
  dpanel.position = new Vector3((dsx * (w - 0.18)) / 2, 1.05, zc + 0.7);
  dpanel.rotation.y = dsx < 0 ? -Math.PI / 2 : Math.PI / 2;
  registry.register(`sdoor.${side}.panel`, dpanel);
  const dhandle = kit.box(`dress.sdoor.${side}.handle`, 0.03, 0.03, 0.14, mats.steel, scene, al);
  dhandle.position = new Vector3((dsx * (w - 0.24)) / 2, 1.02, zc + 1.02);
  const dplaque = kit.box(`dress.sdoor.${side}.plaque`, 0.02, 0.12, 0.34, mats.steel, scene, al);
  dplaque.position = new Vector3((dsx * (w - 0.2)) / 2, 1.72, zc + 0.7);
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
  const ARCH_Z0 = 21.4; // archives door bay in the records bank
  const ARCH_Z1 = 22.8;
  const SR_Z0 = 39.2; // staff room doorway, east clinic stretch
  const SR_Z1 = 40.6;
  const BAY_DEPTH = 1.15;
  const BAY_ZC = (BAY_Z0 + BAY_Z1) / 2;
  // S-2 lift lobby — east-wall alcove around the sealed lift (z≈49.5);
  // the doors sit recessed behind a lit lobby face, a real shaft throat
  // behind them for lift.arrives to open onto
  const LOB_Z0 = 48.4;
  // gallery staff door bay — the glass run splits around it and the
  // leaf's own collider owns the doorway until an anomaly opens it
  const GDOOR_Z0 = 27.5;
  const GDOOR_Z1 = 28.7;
  const LOB_Z1 = 50.6;
  const LOB_DEPTH = 0.55;
  const LOB_ZC = (LOB_Z0 + LOB_Z1) / 2;
  const SHAFT_DEPTH = 0.5;
  // staff washroom — a third real doorway on the east wall, z 18.2–19.2;
  // the leaf stands ajar so the room is enterable every loop
  const WASH_Z0 = 18.2;
  const WASH_Z1 = 19.2;
  const WASH_ZC = (WASH_Z0 + WASH_Z1) / 2;
  const WASH_DEPTH = 2.25; // interior back wall at xHalf + WASH_DEPTH

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

  // soffit drops at zone thresholds — service stations carry lower beam
  // bands; breaks the ceiling line at the gallery + clinic boundaries
  for (const [nm, z] of [
    ["clinic", 32],
    ["gallery", 14],
  ] as const) {
    const sof = kit.box(`dress.soffit.${nm}`, C.xHalf * 2, 0.3, 0.6, mats.wallPanel, scene, root);
    sof.position = new Vector3(0, C.height - 0.15, z);
    const lip = kit.box(`dress.soffit.${nm}.lip`, C.xHalf * 2, 0.05, 0.66, mats.rubber, scene, root);
    lip.position = new Vector3(0, C.height - 0.325, z);
  }

  // Skirting + wall caps — left wall has feature bands, right wall carries
  // the gallery glass z 20–32.
  kit.wallRun("wall.left.0", -C.xHalf, 0, 12, C.height, mats.wallPanel, scene, root, registry);
  // records wall face — split around the archives doorway (z 21.4–22.8)
  // so the glazed door recesses into a real room, not a plane on the bank
  kit.wallRun("wall.left.1a", -C.xHalf, 12, 21.4, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.left.1b", -C.xHalf, 22.8, 32, C.height, mats.wallPanel, scene, root, registry);
  {
    const aHead = kit.box("dress.archives.header", 0.12, C.height - 2.02, 1.46, mats.wallPanel, scene, root);
    aHead.position = new Vector3(-C.xHalf, 2.02 + (C.height - 2.02) / 2, 22.1);
    colliders.push(
      kit.collider("archives.headerCol", 0.14, C.height - 1.98, 1.5, aHead.position.clone(), scene, root),
    );
  }
  kit.wallRun("wall.left.2", -C.xHalf, 32, 42, C.height, mats.wallPanel, scene, root, registry);
  // wall.left.3 ends at the S-2 machinery bay mouth (z 46.2–49.4, a real
  // recess — see the bay block below); wall.left.4 resumes past it
  kit.wallRun("wall.left.3", -C.xHalf, 42, 46.2, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.left.4", -C.xHalf, 49.4, 55, C.height, mats.wallPanel, scene, root, registry);
  // wall.right.0 splits at the service doorway (z 15.0–16.0) — a real
  // opening behind the leaf so service.stairwell can reveal a throat
  kit.wallRun("wall.right.0", C.xHalf, 0, 15.0, C.height, mats.wallPanel, scene, root, registry);
  // wall.right.0b splits again at the washroom doorway (z 18.2–19.2, a
  // real opening into the staff washroom built behind the wall below)
  kit.wallRun("wall.right.0b", C.xHalf, 16.0, 18.2, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.right.0c", C.xHalf, 19.2, 20, C.height, mats.wallPanel, scene, root, registry);
  const svcHeader = kit.box("service.door.header", 0.12, C.height - 2.2, 1.0, mats.wallPanel, scene, root);
  svcHeader.position = new Vector3(C.xHalf, 2.2 + (C.height - 2.2) / 2, 15.5);
  registry.register("service.door.header", svcHeader);

  // right wall 20–32: glass gallery — split around a glazed staff door
  // (z 27.5–28.7, in the gap between desk rows): two fixed panes + a
  // leaf, so the reading room can actually be entered when an anomaly
  // stands the door open
  const glass = kit.box("wall.gallery.glass", 0.06, 2.0, GDOOR_Z0 - 20, mats.darkGlass, scene, root);
  glass.position = new Vector3(C.xHalf, 1.5, (20 + GDOOR_Z0) / 2);
  registry.register("wall.gallery.glass", glass);
  const glassB = kit.box("wall.gallery.glass.b", 0.06, 2.0, 32 - GDOOR_Z1, mats.darkGlass, scene, root);
  glassB.position = new Vector3(C.xHalf, 1.5, (GDOOR_Z1 + 32) / 2);
  registry.register("wall.gallery.glass.b", glassB);
  for (const [lz0, lz1] of [
    [20, GDOOR_Z0],
    [GDOOR_Z1, 32],
  ] as const) {
    const glassLow = kit.box(`wall.gallery.low.${lz0}`, 0.12, 0.5, lz1 - lz0, mats.steel, scene, root);
    glassLow.position = new Vector3(C.xHalf, 0.25, (lz0 + lz1) / 2);
  }
  const glassHigh = kit.box("wall.gallery.high", 0.12, 0.5, 12, mats.steel, scene, root);
  glassHigh.position = new Vector3(C.xHalf, 2.75, 26);
  // steel mullions break the run into readable window bays
  for (const mz of [20, 23, 26, 29, 32]) {
    const mullion = kit.box(`wall.gallery.mullion.${mz}`, 0.09, 2.0, 0.18, mats.steel, scene, root);
    mullion.position = new Vector3(C.xHalf, 1.5, mz);
  }
  // door jambs at the hinge + strike lines
  for (const jz of [GDOOR_Z0, GDOOR_Z1]) {
    const jamb = kit.box(`wall.gallery.jamb.${jz}`, 0.09, 2.0, 0.1, mats.steel, scene, root);
    jamb.position = new Vector3(C.xHalf, 1.5, jz);
  }
  // the glazed leaf — closed it reads as another window bay; hinged on
  // the north jamb so it swings INTO the room when gallery.door opens it
  const leaf = new TransformNode("wall.gallery.door", scene);
  leaf.parent = root;
  leaf.position = new Vector3(C.xHalf, 1.5, GDOOR_Z0 + 0.06);
  registry.register("wall.gallery.door", leaf);
  for (const lz of [0.04, 1.04]) {
    const stile = kit.box(`wall.gallery.door.stile.${lz}`, 0.045, 2.0, 0.055, mats.steel, scene, leaf);
    stile.position = new Vector3(0, 0, lz);
  }
  for (const [ly, lh] of [
    [-0.94, 0.1],
    [0.02, 0.07],
    [0.94, 0.1],
  ] as const) {
    const rail = kit.box(`wall.gallery.door.rail.${ly}`, 0.045, lh, 1.0, mats.steel, scene, leaf);
    rail.position = new Vector3(0, ly, 0.55);
  }
  const lite = kit.box("wall.gallery.doorlite", 0.016, 1.7, 0.94, mats.darkGlass, scene, leaf);
  lite.position = new Vector3(0, 0.06, 0.55);
  registry.register("wall.gallery.doorlite", lite);
  const kick = kit.box("wall.gallery.door.kick", 0.05, 0.26, 1.0, mats.steel, scene, leaf);
  kick.position = new Vector3(0, -0.8, 0.55);
  const lever = kit.box("wall.gallery.door.lever", 0.16, 0.035, 0.045, mats.steel, scene, leaf);
  lever.position = new Vector3(-0.06, -0.52, 0.94);
  const lever2 = kit.box("wall.gallery.door.lever2", 0.16, 0.035, 0.045, mats.steel, scene, leaf);
  lever2.position = new Vector3(0.06, -0.52, 0.94);
  // threshold sill across the bay base — a real lip under the leaf
  const sill = kit.box("dress.gal.sill", 0.1, 0.022, GDOOR_Z1 - GDOOR_Z0 - 0.06, mats.steel, scene, root);
  sill.position = new Vector3(C.xHalf, 0.011, (GDOOR_Z0 + GDOOR_Z1) / 2);
  // personnel plaque on the corridor face — AUTHORIZED PERSONNEL
  const plaque = kit.plane("wall.gallery.door.plaque", 0.52, 0.15, mats.sign.get("sign.gallery")!, scene);
  plaque.parent = leaf;
  plaque.position = new Vector3(-0.028, 0.34, 0.55);
  plaque.rotation.y = Math.PI / 2; // face -x (corridor)
  kit.collider("wall.gallery.door.col", 0.07, 2.0, 1.1, new Vector3(0, 0, 0.55), scene, leaf);
  // venetian blinds drawn down over one bay — the only bay you can't
  // read the room through; child of the glass so gallery anomalies
  // carry it
  const blind = kit.plane("wall.gallery.blind", 2.8, 1.9, mats.blinds, scene);
  blind.parent = glass;
  blind.position = new Vector3(0.08, 0, 0.75);
  blind.rotation.y = -Math.PI / 2;
  registry.register("wall.gallery.blind", blind);
  const galleryBack = kit.box("wall.gallery.back", 0.1, 3.0, 12, mats.wallPanel, scene, root);
  galleryBack.position = new Vector3(C.xHalf + 1.4, 1.5, 26);
  // baseline reading-room interior behind the smoked glass — dark
  // furniture silhouettes + one lit cove line inside the visible band.
  // The room gets its own paint + office-enamel materials: shared
  // steel/rubber read as void inside (same trap as the records bank)
  const galWall = new StandardMaterial("mat.gal.wall", scene);
  galWall.diffuseColor = new Color3(0.3, 0.29, 0.26);
  galWall.specularColor = new Color3(0.02, 0.02, 0.02);
  const galEnamel = new StandardMaterial("mat.gal.enamel", scene);
  galEnamel.diffuseColor = new Color3(0.36, 0.35, 0.31);
  galEnamel.specularColor = new Color3(0.12, 0.12, 0.11);
  const galFloor = kit.box("dress.gal.floor", 1.35, 0.08, 12, mats.concrete, scene, root);
  galFloor.position = new Vector3(C.xHalf + 0.75, -0.02, 26);
  const galCeil = kit.box("dress.gal.ceil", 1.35, 0.08, 12, galWall, scene, root);
  galCeil.position = new Vector3(C.xHalf + 0.75, C.height + 0.02, 26);
  for (const dz of [-6, 6]) {
    const gside = kit.box(`dress.gal.side.${dz}`, 1.35, C.height, 0.1, galWall, scene, root);
    gside.position = new Vector3(C.xHalf + 0.75, C.height / 2, 26 + dz);
  }
  for (const cz of [22, 24.5, 29.5]) {
    const gcab = kit.box(`dress.gal.cab.${cz}`, 0.32, 1.9, 1.5, galEnamel, scene, root);
    gcab.position = new Vector3(C.xHalf + 1.15, 0.95, cz);
  }
  for (const dz of [22.5, 26.5, 30]) {
    const desk = kit.box(`dress.gal.desk.${dz}`, 0.55, 0.74, 1.5, galEnamel, scene, root);
    desk.position = new Vector3(C.xHalf + 0.72, 0.37, dz);
    const chair = kit.box(`dress.gal.chair.${dz}`, 0.35, 0.85, 0.4, mats.rubber, scene, root);
    chair.position = new Vector3(C.xHalf + 1.12, 0.42, dz + 0.3);
  }
  // lit cove at the back — inside the glass band (y 0.5–2.5), the line
  // that makes the room read as occupied space, not void
  // NOTE: named dress.gal* (no dot) — dress.gal. is a merge prefix and these
  // stay anomaly-reachable via the wall.gallery.* registrations
  const gcove = kit.box("dress.galcove", 0.06, 0.05, 11.4, mats.trofferLit, scene, root);
  gcove.position = new Vector3(C.xHalf + 1.3, 2.36, 26);
  // one desk carries a lit monitor face toward the glass — the
  // occupied-room cue at walking distance
  const gmon = kit.box("dress.galmonitor", 0.02, 0.26, 0.38, mats.trofferLit, scene, root);
  gmon.position = new Vector3(C.xHalf + 0.46, 0.88, 26.5);
  // a warm desk lamp left on — a point of light deeper in the room
  // than the monitor, reads through the dark panes as depth
  const glamp = kit.box("dress.gallamp", 0.05, 0.06, 0.05, mats.trofferLit, scene, root);
  glamp.position = new Vector3(C.xHalf + 0.52, 0.82, 24.2);
  // the near screen carries live terminal text — mat.terminal rewrites
  // with the airlock screens, so terminal.advisory leaks into the room
  gmon.material = mats.terminal;
  // a second workstation's dim screen + a dead third — the occupied-room
  // reads through the smoked panes as a row of screens, not one blob
  const dimMonMat = new StandardMaterial("mat.gal.dimmon", scene);
  dimMonMat.diffuseColor = new Color3(0.1, 0.11, 0.12);
  dimMonMat.emissiveColor = new Color3(0.3, 0.34, 0.34);
  const gd2 = kit.box("dress.gal.monitor.dim", 0.02, 0.24, 0.34, dimMonMat, scene, root);
  gd2.position = new Vector3(C.xHalf + 0.46, 0.88, 22.5);
  const gd3 = kit.box("dress.gal.monitor.off", 0.02, 0.24, 0.34, mats.rubber, scene, root);
  gd3.position = new Vector3(C.xHalf + 0.46, 0.88, 30);
  // keyboards + paper clutter on the desk tops
  const galPaper = new StandardMaterial("mat.gal.paper", scene);
  galPaper.diffuseColor = new Color3(0.72, 0.7, 0.64);
  galPaper.emissiveColor = new Color3(0.07, 0.065, 0.05);
  for (const dz of [22.5, 26.5, 30]) {
    const kb = kit.box(`dress.gal.kb.${dz}`, 0.26, 0.02, 0.1, mats.steel, scene, root);
    kb.position = new Vector3(C.xHalf + 0.56, 0.75, dz - 0.25);
    const stk = kit.box(`dress.gal.paper.${dz}`, 0.12, 0.035, 0.16, galPaper, scene, root);
    stk.position = new Vector3(C.xHalf + 0.62, 0.76, dz + 0.4);
  }
  // pinboard on the back wall — cork slab + pinned sheets in a loose grid
  const gboard = kit.box("dress.gal.board", 0.04, 0.8, 1.3, mats.rubber, scene, root);
  gboard.position = new Vector3(C.xHalf + 1.33, 1.7, 24.5);
  for (const [by, bz] of [
    [1.55, 24.05],
    [1.78, 24.3],
    [1.62, 24.85],
    [1.85, 24.95],
  ] as const) {
    const pin = kit.box(`dress.gal.pin.${by}.${bz}`, 0.015, 0.2, 0.16, galPaper, scene, root);
    pin.position = new Vector3(C.xHalf + 1.29, by, bz);
  }
  // room dressing — the inspection reward for stepping inside: binder
  // shelf over the south desks, a coat left on the rail, waste bin, a
  // mug on the near desk. dress.gal. names fold into the static merge
  for (const sy of [1.9, 2.25]) {
    const shelf = kit.box(`dress.gal.shelf.${sy}`, 0.28, 0.04, 3.4, galEnamel, scene, root);
    shelf.position = new Vector3(C.xHalf + 1.16, sy, 29.9);
  }
  for (let i = 0; i < 7; i++) {
    const binder = kit.box(
      `dress.gal.binder.${i}`,
      0.2,
      0.28,
      0.09,
      i % 3 === 0 ? mats.cabinetRed : i % 3 === 1 ? galPaper : mats.rubber,
      scene,
      root,
    );
    binder.position = new Vector3(C.xHalf + 1.18, 2.08, 28.6 + i * 0.34 + (i % 2) * 0.05);
  }
  // coat rail + one coat left hanging on the north side wall
  const rail = kit.box("dress.gal.rail", 0.03, 0.03, 0.5, mats.steel, scene, root);
  rail.position = new Vector3(C.xHalf + 0.4, 1.78, 20.14);
  const coat = kit.box("dress.gal.coat", 0.42, 0.85, 0.06, mats.rubber, scene, root);
  coat.position = new Vector3(C.xHalf + 0.4, 1.32, 20.18);
  // waste bin + a mug on the desk by the door
  const bin = kit.box("dress.gal.bin", 0.24, 0.34, 0.24, mats.rubber, scene, root);
  bin.position = new Vector3(C.xHalf + 0.35, 0.17, 31.2);
  const mug = kit.box("dress.gal.mug", 0.07, 0.1, 0.07, mats.cabinetRed, scene, root);
  mug.position = new Vector3(C.xHalf + 0.6, 0.79, 26.3);
  registry.register("wall.gallery.cove", gcove);
  registry.register("wall.gallery.monitor", gmon);
  registry.register("wall.gallery.lamp", glamp);
  registry.register("wall.gallery.back", galleryBack);
  // interior shell colliders — sealed regardless of the leaf: the room
  // becomes walkable only through the doorway itself, in the pocket
  // between the furniture rows (z 27.3–28.9)
  colliders.push(
    kit.collider(
      "gal.col.back",
      0.12,
      C.height,
      12,
      new Vector3(C.xHalf + 1.34, C.height / 2, 26),
      scene,
      root,
    ),
  );
  for (const sz of [20, 32]) {
    colliders.push(
      kit.collider(
        `gal.col.side.${sz}`,
        1.4,
        C.height,
        0.12,
        new Vector3(C.xHalf + 0.75, C.height / 2, sz),
        scene,
        root,
      ),
    );
  }
  for (const [cz0, cz1] of [
    [20.5, 27.3],
    [28.9, 31.6],
  ] as const) {
    colliders.push(
      kit.collider(
        `gal.col.furn.${cz0}`,
        0.95,
        1.3,
        cz1 - cz0,
        new Vector3(C.xHalf + 0.95, 0.65, (cz0 + cz1) / 2),
        scene,
        root,
      ),
    );
  }
  // wall.right.2 splits around the staff room doorway (z 39.2–40.6) —
  // same recipe as the archives cut on the west bank
  // wall.right.2a splits again at the supply cage mouth (z 33.8–36.2) —
  // the recess is sealed by its own collider but the face must be open
  kit.wallRun("wall.right.2a", C.xHalf, 32, 33.8, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.right.2a2", C.xHalf, 36.2, SR_Z0, C.height, mats.wallPanel, scene, root, registry);
  kit.wallRun("wall.right.2b", C.xHalf, SR_Z1, LOB_Z0, C.height, mats.wallPanel, scene, root, registry);
  {
    const srHead = kit.box(
      "dress.staffroom.header",
      0.12,
      C.height - 2.02,
      SR_Z1 - SR_Z0 + 0.06,
      mats.wallPanel,
      scene,
      root,
    );
    srHead.position = new Vector3(C.xHalf, 2.02 + (C.height - 2.02) / 2, (SR_Z0 + SR_Z1) / 2);
    colliders.push(
      kit.collider(
        "staffroom.headerCol",
        0.14,
        C.height - 1.98,
        SR_Z1 - SR_Z0 + 0.1,
        srHead.position.clone(),
        scene,
        root,
      ),
    );
  }
  kit.wallRun("wall.right.2.s", C.xHalf, LOB_Z1, 55, C.height, mats.wallPanel, scene, root, registry);

  // continuous colliders per wall (glass section collides too); the west
  // wall splits around the S-2 bay mouth (z 46.2–49.4) so you can walk in,
  // and the east wall splits at the gallery door bay (z 27.5–28.7) so the
  // leaf's own collider owns the doorway
  for (const sx of [-1, 1]) {
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, ARCH_Z0],
            [ARCH_Z1, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [
            [C.z0, 15.0],
            [16.0, WASH_Z0],
            [WASH_Z1, GDOOR_Z0],
            [GDOOR_Z1, SR_Z0],
            [SR_Z1, LOB_Z0],
            [LOB_Z1, C.z1],
          ];
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

  // a faint lamp inside the gallery room — makes the space read as
  // occupied through the smoked panes, silhouettes the furniture when
  // you're inside, and spills a lit wedge through the doorway when the
  // leaf stands open; dies with the zone's kills
  const galLight = new PointLight("light.gallery", new Vector3(C.xHalf + 0.7, 1.9, 27.0), scene);
  galLight.diffuse = new Color3(0.95, 0.82, 0.6);
  galLight.intensity = 2.3;
  galLight.range = 5.2;
  const galleryZone = zones.find((z) => z.name === "gallery");
  if (galleryZone) {
    galleryZone.extraLights.push(galLight);
    // the room's lit cove + desk lamp are trofferLit — they die with
    // the zone like every other fixture face. The monitors keep their
    // own materials (a dead zone can still have live screens)
    galleryZone.troffers.push(gcove, glamp);
  }
  registry.register("light.gallery", galLight as unknown as AbstractMesh);

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
    // services actually branch in — a conduit drop on the north cheek +
    // a run along the bay's back wall feeding a junction box (the corridor
    // tray/conduit gapped at the mouth for exactly this)
    const bayCond = kit.box("junction.bay.cond.drop", 0.04, 0.55, 0.04, mats.steel, scene, root);
    bayCond.position = new Vector3(-C.xHalf - 0.07, C.height - 0.28, BAY_Z0 + 0.3);
    const bayJbox = kit.box("junction.bay.cond.jbox", 0.09, 0.13, 0.08, mats.steel, scene, root);
    bayJbox.position = new Vector3(-C.xHalf - 0.07, C.height - 0.58, BAY_Z0 + 0.3);
    const bayRun = kit.box(
      "junction.bay.cond.run",
      0.04,
      0.04,
      BAY_Z1 - BAY_Z0 - 0.5,
      mats.steel,
      scene,
      root,
    );
    bayRun.position = new Vector3(-C.xHalf - BAY_DEPTH + 0.07, C.height - 0.42, BAY_ZC);

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
    // dimmer dedicated emissive — full trofferLit blows to a white blob at
    // arm's length inside the bay (still zone-killed via junction.troffers)
    const bayLampMat = new StandardMaterial("mat.baylamp", scene);
    bayLampMat.diffuseColor = new Color3(0.32, 0.3, 0.26);
    bayLampMat.emissiveColor = new Color3(0.5, 0.42, 0.3);
    const cageGlass = kit.box("junction.baylamp", 0.05, 0.09, 0.16, bayLampMat, scene, root);
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
      "junction.bayvalve",
      { height: 0.03, diameter: 0.16, tessellation: 12 },
      scene,
    );
    valve.material = mats.cabinetRed;
    valve.rotation.z = Math.PI / 2;
    valve.position = new Vector3(backFace + 0.08, 1.5, BAY_Z0 + 0.5);
    registry.register("junction.bayvalve", valve);
    for (let sp = 0; sp < 4; sp++) {
      const spoke = kit.box(`junction.bayvalvespoke.${sp}`, 0.012, 0.14, 0.012, mats.rubber, scene, root);
      spoke.position = new Vector3(backFace + 0.09, 1.5, BAY_Z0 + 0.5);
      spoke.rotation.x = (sp * Math.PI) / 4;
      registry.register(`junction.bayvalvespoke.${sp}`, spoke);
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
    // the bay's glow spills into the corridor — a crossed-plane shaft in
    // the mouth plus a warm pool on the terrazzo. Both ride the junction
    // zone's shafts[] so kills/dips/blackout douse them with the lamps.
    // Names stay OFF junction.bay. — that prefix merges, and these must
    // stay live meshes the zone can toggle.
    const bayShaft = new TransformNode("junction.bayshaft", scene);
    bayShaft.parent = root;
    bayShaft.position = new Vector3(-C.xHalf + 0.08, 1.45, BAY_ZC);
    registry.register("junction.bayshaft", bayShaft);
    for (const ry of [0, Math.PI / 2]) {
      const p = kit.plane(
        `junction.bayshaft.${ry === 0 ? "z" : "x"}`,
        0.72,
        2.35,
        mats.lightShaft,
        scene,
        bayShaft,
      );
      p.rotation.y = ry;
      p.billboardMode = 0;
    }
    const baySpill = kit.plane("junction.bayspill", 1.5, 2.9, mats.lightShaft, scene, root);
    baySpill.rotation.x = -Math.PI / 2; // flat, face-up on the floor
    baySpill.rotation.z = Math.PI / 2; // long axis across the mouth
    baySpill.position = new Vector3(-C.xHalf + 0.78, 0.015, BAY_ZC);
    registry.register("junction.bayspill", baySpill);
    if (junctionZone) {
      junctionZone.shafts.push(bayShaft);
      junctionZone.shafts.push(baySpill);
    }
  }

  // ─── S-2 lift lobby — a lit alcove cut into the east wall z 48.4–50.6.
  //    The sealed doors recess behind a framed lobby face; a real shaft
  //    throat sits behind them so lift.arrives opens onto depth, not a
  //    flat plane. Shell meshes merge under dress.*; colliders make the
  //    mouth a second real doorway off the corridor. ───────────────────
  {
    const lobW = LOB_Z1 - LOB_Z0;
    const lback = C.xHalf + LOB_DEPTH; // interior back face x=2.35
    const sback = lback + SHAFT_DEPTH; // shaft back plate x=2.85
    // header + steel lintel over the mouth
    const lobHeader = kit.box("dress.lobby.header", 0.12, 0.5, lobW + 0.24, mats.wallPanel, scene, root);
    lobHeader.position = new Vector3(C.xHalf, C.height - 0.25, LOB_ZC);
    const lobLintel = kit.box("dress.lobby.lintel", 0.06, 0.08, lobW + 0.26, mats.steel, scene, root);
    lobLintel.position = new Vector3(C.xHalf - 0.06, 2.48, LOB_ZC);
    colliders.push(
      kit.collider(
        "dress.lobby.headerCol",
        0.14,
        0.52,
        lobW + 0.24,
        new Vector3(C.xHalf, C.height - 0.26, LOB_ZC),
        scene,
        root,
      ),
    );
    // side cheeks — the recess jambs
    for (const [i, cz] of [LOB_Z0, LOB_Z1].entries()) {
      const cheek = kit.box(
        `dress.lobby.cheek.${i}`,
        LOB_DEPTH + 0.06,
        2.5,
        0.12,
        mats.wallPanel,
        scene,
        root,
      );
      cheek.position = new Vector3(C.xHalf + LOB_DEPTH / 2, 1.25, cz);
      colliders.push(
        kit.collider(
          `dress.lobby.cheekCol.${i}`,
          LOB_DEPTH + 0.06,
          2.5,
          0.14,
          new Vector3(C.xHalf + LOB_DEPTH / 2, 1.25, cz),
          scene,
          root,
        ),
      );
    }
    // back wall around a real door opening (1.6 wide × 2.4 tall)
    const doorHW = 0.8;
    const backSpans: [number, number][] = [
      [LOB_Z0, LOB_ZC - doorHW],
      [LOB_ZC + doorHW, LOB_Z1],
    ];
    for (const [i, [b0, b1]] of backSpans.entries()) {
      const slab = kit.box(`dress.lobby.back.${i}`, 0.1, 2.5, b1 - b0, mats.wallPanel, scene, root);
      slab.position = new Vector3(lback + 0.05, 1.25, (b0 + b1) / 2);
      colliders.push(
        kit.collider(
          `dress.lobby.backCol.${i}`,
          0.14,
          2.6,
          b1 - b0,
          new Vector3(lback + 0.06, 1.3, (b0 + b1) / 2),
          scene,
          root,
        ),
      );
    }
    const lobBackH = kit.box("dress.lobby.back.h", 0.1, 0.12, doorHW * 2, mats.wallPanel, scene, root);
    lobBackH.position = new Vector3(lback + 0.05, 2.44, LOB_ZC);
    // recessed lobby ceiling + terrazzo floor continuing into the alcove
    const lobCeil = kit.box(
      "dress.lobby.ceil",
      LOB_DEPTH + 0.14,
      0.55,
      lobW + 0.1,
      mats.ceiling,
      scene,
      root,
    );
    lobCeil.position = new Vector3(C.xHalf + LOB_DEPTH / 2 - 0.02, 2.78, LOB_ZC);
    const lobFloor = kit.box(
      "dress.lobby.floor",
      LOB_DEPTH + 0.05,
      0.05,
      lobW + 0.04,
      mats.terrazzo,
      scene,
      root,
    );
    lobFloor.position = new Vector3(C.xHalf + LOB_DEPTH / 2 - 0.01, -0.025, LOB_ZC);
    colliders.push(
      kit.collider(
        "dress.lobby.floorCol",
        LOB_DEPTH + 0.1,
        0.1,
        lobW + 0.04,
        new Vector3(C.xHalf + LOB_DEPTH / 2 - 0.01, -0.05, LOB_ZC),
        scene,
        root,
      ),
    );
    // steel architrave outlining the mouth on the corridor face
    const lobFtop = kit.box("dress.lobby.frame.top", 0.05, 0.09, lobW + 0.3, mats.steel, scene, root);
    lobFtop.position = new Vector3(C.xHalf - 0.02, 2.55, LOB_ZC);
    for (const [i, fz] of [LOB_Z0 - 0.05, LOB_Z1 + 0.05].entries()) {
      const jamb = kit.box(`dress.lobby.jamb.${i}`, 0.05, 2.55, 0.08, mats.steel, scene, root);
      jamb.position = new Vector3(C.xHalf - 0.02, 1.275, fz);
    }
    // shaft throat behind the door opening — the darkness the leaves part onto
    for (const [i, sz] of [LOB_ZC - doorHW, LOB_ZC + doorHW].entries()) {
      const scheek = kit.box(`lift.shaft.cheek.${i}`, SHAFT_DEPTH, 2.5, 0.1, mats.rubber, scene, root);
      scheek.position = new Vector3(lback + SHAFT_DEPTH / 2, 1.25, sz);
      colliders.push(
        kit.collider(
          `lift.shaft.cheekCol.${i}`,
          SHAFT_DEPTH,
          2.5,
          0.14,
          new Vector3(lback + SHAFT_DEPTH / 2, 1.25, sz),
          scene,
          root,
        ),
      );
    }
    const shaftTop = kit.box("lift.shaft.top", SHAFT_DEPTH, 0.3, doorHW * 2 + 0.1, mats.rubber, scene, root);
    shaftTop.position = new Vector3(lback + SHAFT_DEPTH / 2, 2.62, LOB_ZC);
    const shaftBot = kit.box("lift.shaft.bot", SHAFT_DEPTH, 0.06, doorHW * 2 + 0.1, mats.rubber, scene, root);
    shaftBot.position = new Vector3(lback + SHAFT_DEPTH / 2, 0.03, LOB_ZC);
    colliders.push(
      kit.collider(
        "lift.shaft.floorCol",
        SHAFT_DEPTH + 0.2,
        0.1,
        doorHW * 2 + 0.2,
        new Vector3(lback + SHAFT_DEPTH / 2 - 0.02, -0.02, LOB_ZC),
        scene,
        root,
      ),
    );
    colliders.push(
      kit.collider(
        "lift.shaft.backCol",
        0.14,
        2.5,
        doorHW * 2 + 0.1,
        new Vector3(sback - 0.04, 1.25, LOB_ZC),
        scene,
        root,
      ),
    );
    // a hairline of light leaking from the floor above — the shaft goes on
    const seam = kit.box("lift.shaft.seam", 0.02, 0.03, 1.1, mats.trofferDim, scene, root);
    seam.position = new Vector3(sback - 0.1, 2.44, LOB_ZC);
    // lobby ceiling light — joins the junction zone's kill paths
    const lobLampMat = new StandardMaterial("mat.lobbylamp", scene);
    lobLampMat.diffuseColor = new Color3(0.3, 0.29, 0.26);
    lobLampMat.emissiveColor = new Color3(0.48, 0.42, 0.32);
    const lobLamp = kit.box("dress.lobbylamp", 0.16, 0.05, 0.5, lobLampMat, scene, root);
    lobLamp.position = new Vector3(C.xHalf + LOB_DEPTH / 2, 2.5, LOB_ZC);
    const lobLight = new PointLight(
      "light.lobby",
      new Vector3(C.xHalf + LOB_DEPTH - 0.2, 2.2, LOB_ZC),
      scene,
    );
    lobLight.intensity = 2.6;
    lobLight.range = 5.5;
    lobLight.diffuse = new Color3(1.0, 0.9, 0.74);
    const jz = zones.find((z) => z.name === "junction");
    if (jz) {
      jz.extraLights.push(lobLight);
      jz.troffers.push(lobLamp);
    }
    registry.register("light.lobby", lobLight as unknown as AbstractMesh);
    registry.register("dress.lobbylamp", lobLamp);
    // directory plaque beside the mouth — LIFT S-2 territory marker
    const lobPlaque = kit.box("dress.lobby.plaque", 0.03, 0.14, 0.36, mats.steel, scene, root);
    lobPlaque.position = new Vector3(C.xHalf - 0.035, 1.7, LOB_Z1 + 0.18);
    moteAnchors.push({ x: C.xHalf + LOB_DEPTH / 2, z: LOB_ZC, zi: 3 });
  }

  // ─── staff washroom — a real tiled room behind wall.right.0b/c,
  //    z 16.5–19.95 × depth 2.25. The leaf stands ajar every loop: a
  //    public-room door, not a sealed one. Porcelain interiors get their
  //    own materials (galWall/galEnamel would read office-warm; washrooms
  //    run cold). Wired to the GALLERY zone's kill paths (z≈18.7). ─────
  {
    const washBackX = C.xHalf + WASH_DEPTH; // interior back face x=4.3
    // pale lit StandardMaterials blow out under the room's own point
    // light (the records-bank trap) — diffuse stays low; the tile reads
    // pale because the light is pale, not because the albedo is
    const washTile = new StandardMaterial("mat.wash.tile", scene);
    washTile.diffuseColor = new Color3(0.14, 0.16, 0.175);
    washTile.specularColor = new Color3(0.04, 0.045, 0.05);
    washTile.specularPower = 48;
    const washFloor = new StandardMaterial("mat.wash.floor", scene);
    washFloor.diffuseColor = new Color3(0.09, 0.1, 0.105);
    washFloor.specularColor = new Color3(0.05, 0.055, 0.06);
    washFloor.specularPower = 64;
    const washPorcelain = new StandardMaterial("mat.wash.porcelain", scene);
    washPorcelain.diffuseColor = new Color3(0.2, 0.215, 0.22);
    washPorcelain.specularColor = new Color3(0.06, 0.07, 0.07);
    washPorcelain.specularPower = 72;
    const washDoorMat = new StandardMaterial("mat.wash.door", scene);
    washDoorMat.diffuseColor = new Color3(0.19, 0.22, 0.2);
    washDoorMat.specularColor = new Color3(0.03, 0.03, 0.03);
    // doorway header + jambs on the corridor face
    const washHeader = kit.box(
      "wash.header",
      0.12,
      C.height - 2.1,
      WASH_Z1 - WASH_Z0 + 0.2,
      mats.wallPanel,
      scene,
      root,
    );
    washHeader.position = new Vector3(C.xHalf, 2.1 + (C.height - 2.1) / 2, WASH_ZC);
    colliders.push(
      kit.collider(
        "wash.headerCol",
        0.14,
        C.height - 2.1,
        WASH_Z1 - WASH_Z0 + 0.2,
        new Vector3(C.xHalf, 2.1 + (C.height - 2.1) / 2, WASH_ZC),
        scene,
        root,
      ),
    );
    for (const [i, jz] of [WASH_Z0, WASH_Z1].entries()) {
      const jamb = kit.box(`wash.jamb.${i}`, 0.05, 2.1, 0.07, mats.steel, scene, root);
      jamb.position = new Vector3(C.xHalf - 0.01, 1.05, jz);
      colliders.push(
        kit.collider(`wash.jambCol.${i}`, 0.14, 2.1, 0.1, new Vector3(C.xHalf, 1.05, jz), scene, root),
      );
    }
    // reveal liners inside the cut wall's raw edges
    for (const [i, rz] of [WASH_Z0 + 0.03, WASH_Z1 - 0.03].entries()) {
      const rev = kit.box(`wash.reveal.${i}`, 0.22, 2.1, 0.05, washTile, scene, root);
      rev.position = new Vector3(C.xHalf + 0.11, 1.05, rz);
    }
    // the leaf — hinged on the north jamb (z=WASH_Z0), standing ajar
    // into the room so the tile + mirror read from the corridor
    const washDoor = new TransformNode("wash.door", scene);
    washDoor.parent = root;
    washDoor.position = new Vector3(C.xHalf, 0, WASH_Z0 + 0.02);
    washDoor.rotation.y = -1.05;
    registry.register("wash.door", washDoor);
    const wleaf = kit.box("wash.door.leaf", 0.045, 2.05, 0.94, washDoorMat, scene, washDoor);
    wleaf.position = new Vector3(0, 1.025, 0.49);
    const wkick = kit.box("wash.door.kick", 0.05, 0.24, 0.9, mats.steel, scene, washDoor);
    wkick.position = new Vector3(0, 0.14, 0.49);
    for (const side of [-1, 1]) {
      const pull = kit.box(`wash.door.pull.${side}`, 0.02, 0.16, 0.06, mats.steel, scene, washDoor);
      pull.position = new Vector3(side * 0.035, 1.0, 0.88);
    }
    kit.collider("wash.door.col", 0.05, 2.05, 0.96, new Vector3(0, 1.02, 0.49), scene, washDoor);
    // WASHROOM plaque on the corridor face above the door
    const washPlaque = kit.plane("wash.plaque", 0.46, 0.14, mats.sign.get("sign.washroom")!, scene);
    washPlaque.parent = root;
    washPlaque.position = new Vector3(C.xHalf - 0.035, 2.28, WASH_ZC);
    washPlaque.rotation.y = Math.PI / 2; // east-wall plane faces the corridor (-x)
    // interior shell — porcelain walls/floor, dropped ceiling at 2.62
    const wfloor = kit.box("wash.floor", WASH_DEPTH + 0.1, 0.06, 3.5, washFloor, scene, root);
    wfloor.position = new Vector3(C.xHalf + WASH_DEPTH / 2 - 0.01, -0.03, 18.25);
    const wceil = kit.box("wash.ceil", WASH_DEPTH + 0.14, 0.08, 3.55, washTile, scene, root);
    wceil.position = new Vector3(C.xHalf + WASH_DEPTH / 2 - 0.02, 2.66, 18.22);
    const wbackMesh = kit.box("wash.wall.back", 0.1, 2.7, 3.5, washTile, scene, root);
    wbackMesh.position = new Vector3(washBackX + 0.05, 1.35, 18.25);
    colliders.push(
      kit.collider(
        "wash.wall.backCol",
        0.14,
        2.7,
        3.55,
        new Vector3(washBackX + 0.06, 1.35, 18.25),
        scene,
        root,
      ),
    );
    for (const [i, wz] of [16.5, 19.95].entries()) {
      const swall = kit.box(`wash.wall.${i}`, WASH_DEPTH + 0.06, 2.7, 0.1, washTile, scene, root);
      swall.position = new Vector3(C.xHalf + WASH_DEPTH / 2, 1.35, wz);
      colliders.push(
        kit.collider(
          `wash.wall.col.${i}`,
          WASH_DEPTH + 0.1,
          2.7,
          0.14,
          new Vector3(C.xHalf + WASH_DEPTH / 2, 1.35, wz),
          scene,
          root,
        ),
      );
    }
    // vanity slab along the back wall — two inset basin wells + taps
    const vanity = kit.box("wash.vanity", 0.42, 0.5, 2.1, washPorcelain, scene, root);
    vanity.position = new Vector3(washBackX - 0.23, 0.62, 18.35);
    colliders.push(
      kit.collider(
        "wash.vanity.col",
        0.45,
        0.55,
        2.15,
        new Vector3(washBackX - 0.24, 0.62, 18.35),
        scene,
        root,
      ),
    );
    for (const [i, bz] of [17.8, 18.9].entries()) {
      const basin = kit.box(`wash.basin.${i}`, 0.3, 0.05, 0.44, mats.rubber, scene, root);
      basin.position = new Vector3(washBackX - 0.24, 0.885, bz);
      const rim = kit.box(`wash.basin.rim.${i}`, 0.34, 0.02, 0.5, washPorcelain, scene, root);
      rim.position = new Vector3(washBackX - 0.24, 0.9, bz);
      // tap: column + downturned nozzle over the well
      const tap = new TransformNode(`wash.tap.${i}`, scene);
      tap.parent = root;
      tap.position = new Vector3(washBackX - 0.06, 0.9, bz);
      registry.register(`wash.tap.${i}`, tap);
      const col = kit.box(`wash.tap.col.${i}`, 0.035, 0.16, 0.035, mats.steel, scene, tap);
      col.position = new Vector3(0, 0.08, 0);
      const arm = kit.box(`wash.tap.arm.${i}`, 0.16, 0.03, 0.035, mats.steel, scene, tap);
      arm.position = new Vector3(-0.08, 0.16, 0);
      const noz = kit.box(`wash.tap.noz.${i}`, 0.03, 0.05, 0.03, mats.steel, scene, tap);
      noz.position = new Vector3(-0.15, 0.135, 0);
    }
    // the mirror — plane over the vanity facing the door. Its material
    // paints a dim smear of the room (no RTT); wash.mirror repaints it
    // with a figure that shouldn't be there
    const mirrorTex = new DynamicTexture("tex.wash.mirror", { width: 128, height: 160 }, scene, false);
    {
      const mc = mirrorTex.getContext() as unknown as CanvasRenderingContext2D;
      const g = mc.createLinearGradient(0, 0, 0, 160);
      g.addColorStop(0, "#1c2226");
      g.addColorStop(0.55, "#171d21");
      g.addColorStop(1, "#10151a");
      mc.fillStyle = g;
      mc.fillRect(0, 0, 128, 160);
      // soft vertical fluoro smears — the room's strip light bouncing
      for (const sx of [30, 88]) {
        const f = mc.createLinearGradient(sx - 6, 0, sx + 6, 0);
        f.addColorStop(0, "rgba(190,215,220,0)");
        f.addColorStop(0.5, "rgba(190,215,220,0.14)");
        f.addColorStop(1, "rgba(190,215,220,0)");
        mc.fillStyle = f;
        mc.fillRect(sx - 6, 8, 12, 120);
      }
      // pale band of the opposite wall + basin sheen at the bottom edge
      mc.fillStyle = "rgba(150,160,158,0.09)";
      mc.fillRect(0, 96, 128, 10);
      mc.fillStyle = "rgba(200,215,215,0.12)";
      mc.fillRect(14, 140, 100, 7);
    }
    mirrorTex.update();
    const mirrorMat = new StandardMaterial("mat.wash.mirror", scene);
    mirrorMat.diffuseTexture = mirrorTex;
    mirrorMat.emissiveTexture = mirrorTex;
    mirrorMat.emissiveColor = new Color3(0.78, 0.84, 0.88);
    mirrorMat.specularColor = new Color3(0.5, 0.55, 0.6);
    mirrorMat.specularPower = 96;
    mirrorMat.backFaceCulling = false;
    const mirror = kit.plane("wash.mirror", 1.9, 0.95, mirrorMat, scene);
    mirror.parent = root;
    mirror.position = new Vector3(washBackX - 0.015, 1.52, 18.35);
    mirror.rotation.y = Math.PI / 2; // faces -x back across the room
    registry.register("wash.mirror", mirror);
    // steel frame strips make the mirror read as mounted, not a hole
    const mframe = kit.box("wash.mirror.frame", 0.03, 1.03, 2.0, mats.steel, scene, root);
    mframe.position = new Vector3(washBackX - 0.005, 1.52, 18.35);
    // towel dispenser beside the mirror + waste bin below
    const disp = kit.box("wash.dispenser", 0.14, 0.3, 0.26, washDoorMat, scene, root);
    disp.position = new Vector3(washBackX - 0.09, 1.4, 17.05);
    const displit = kit.box("wash.dispenser.slit", 0.02, 0.03, 0.18, mats.rubber, scene, root);
    displit.position = new Vector3(washBackX - 0.17, 1.31, 17.05);
    const bin = kit.box("wash.bin", 0.26, 0.4, 0.3, mats.steel, scene, root);
    bin.position = new Vector3(washBackX - 0.32, 0.2, 17.0);
    // two stalls on the north wall — partitions + doors with a real
    // under-gap; the doors are pivots so stall.occupied can shut one
    const stallMat = new StandardMaterial("mat.wash.stall", scene);
    stallMat.diffuseColor = new Color3(0.095, 0.11, 0.105);
    stallMat.specularColor = new Color3(0.02, 0.02, 0.02);
    // stalls x2.05→3.5, two of them split at x2.77, fronts at z17.15;
    // doors pivot on their west jambs and swing INTO the stalls (restroom
    // in-swing) — ajar leaves sit folded inside, not into the floor space
    for (const [i, px] of [2.77, 3.5].entries()) {
      const part = kit.box(`wash.stall.part.${i}`, 0.04, 1.85, 0.62, stallMat, scene, root);
      part.position = new Vector3(px, 0.925, 16.83);
      colliders.push(
        kit.collider(`wash.stall.partCol.${i}`, 0.06, 1.9, 0.66, new Vector3(px, 0.95, 16.83), scene, root),
      );
      const post = kit.box(`wash.stall.post.${i}`, 0.05, 1.85, 0.05, mats.steel, scene, root);
      post.position = new Vector3(px, 0.925, 17.15);
    }
    for (const [i, hx] of [2.15, 2.87].entries()) {
      const sdoor = new TransformNode(`wash.stall.door.${i}`, scene);
      sdoor.parent = root;
      sdoor.position = new Vector3(hx, 0, 17.13);
      sdoor.rotation.y = i === 0 ? -0.55 : -1.3; // both ajar, differently
      registry.register(`wash.stall.door.${i}`, sdoor);
      const sdl = kit.box(`wash.stall.leaf.${i}`, 0.62, 1.6, 0.03, stallMat, scene, sdoor);
      sdl.position = new Vector3(0.31, 0.95, 0); // leaf spans the front along +x
      kit.collider(`wash.stall.leafCol.${i}`, 0.66, 1.65, 0.05, new Vector3(0.31, 0.95, 0), scene, sdoor);
      const knob = kit.box(`wash.stall.knob.${i}`, 0.03, 0.05, 0.05, mats.steel, scene, sdoor);
      knob.position = new Vector3(0.56, 1.0, 0.03);
    }
    // hand dryer on the north wall past the stalls
    const dryer = kit.box("wash.dryer", 0.16, 0.3, 0.24, washPorcelain, scene, root);
    dryer.position = new Vector3(3.7, 1.15, 16.56);
    registry.register("wash.dryer", dryer);
    colliders.push(
      kit.collider("wash.dryer.col", 0.2, 0.34, 0.28, new Vector3(3.7, 1.15, 16.6), scene, root),
    );
    const dryNoz = kit.box("wash.dryer.noz", 0.12, 0.04, 0.1, mats.steel, scene, root);
    dryNoz.position = new Vector3(3.7, 0.99, 16.62);
    const dryLed = kit.box("wash.dryer.led", 0.03, 0.03, 0.03, mats.trofferDim, scene, root);
    dryLed.position = new Vector3(3.7, 1.28, 16.68);
    registry.register("wash.dryer.led", dryLed);
    // floor drain + a permanent damp sheen beside the vanity
    const drain = CreateCylinder("wash.drain", { height: 0.015, diameter: 0.14, tessellation: 12 }, scene);
    drain.material = mats.rubber;
    drain.parent = root;
    drain.position = new Vector3(3.0, 0.008, 18.6);
    const wet = kit.plane("wash.wet", 0.9, 0.7, mats.puddle, scene);
    wet.parent = root;
    wet.rotation.x = Math.PI / 2;
    wet.position = new Vector3(3.6, 0.006, 18.3);
    colliders.push(
      kit.collider(
        "wash.floorCol",
        WASH_DEPTH + 0.1,
        0.1,
        3.5,
        new Vector3(C.xHalf + WASH_DEPTH / 2 - 0.01, -0.05, 18.25),
        scene,
        root,
      ),
    );
    // the strip light — cold fluoro on a porcelain room reads harsh
    const washLampMat = new StandardMaterial("mat.wash.lamp", scene);
    washLampMat.diffuseColor = new Color3(0.5, 0.55, 0.58);
    washLampMat.emissiveColor = new Color3(0.62, 0.72, 0.78);
    const wlamp = kit.box("wash.lamp", 0.16, 0.05, 1.1, washLampMat, scene, root);
    wlamp.position = new Vector3(3.15, 2.6, 18.25);
    registry.register("wash.lamp", wlamp);
    const wlight = new PointLight("light.wash", new Vector3(3.1, 2.35, 18.3), scene);
    wlight.diffuse = new Color3(0.86, 0.95, 1.0);
    wlight.intensity = 1.9;
    wlight.range = 4.6;
    registry.register("light.wash", wlight as unknown as AbstractMesh);
    const gz = zones.find((z) => z.name === "gallery");
    if (gz) {
      gz.extraLights.push(wlight);
      gz.troffers.push(wlamp);
    }
    moteAnchors.push({ x: 3.1, z: 18.3, zi: 1 });
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
        : [
            [C.z0, 15.0],
            [16.0, WASH_Z0],
            [WASH_Z1, LOB_Z0],
            [LOB_Z1, C.z1],
          ];
    spans.forEach(([s0, s1], i) => {
      const strip = kit.plane(`dress.ao.${sx}${i ? ".s" : ""}`, s1 - s0, 0.55, mats.aoStrip, scene, root);
      strip.position = new Vector3(sx * (C.xHalf - 0.065), 0.28, (s0 + s1) / 2);
      strip.rotation.y = sx < 0 ? -Math.PI / 2 : Math.PI / 2;
    });
  }

  // dark terrazzo border band along each wall base — station-floor
  // framing, and it grounds the AO strips
  for (const sx of [-1, 1]) {
    const border = kit.plane(`dress.fborder.${sx}`, 0.36, 55, mats.fborder, scene, root);
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
  // bank is split around the archives doorway (z 21.3–22.9) — a real
  // glazed door recesses there; `records.cabinets` stays the registered
  // name as a parent node so cabinet.* / records.* / figure.records
  // anomalies keep addressing the whole bank
  const cabNode = new TransformNode("records.cabinets", scene);
  cabNode.parent = root;
  registry.register("records.cabinets", cabNode);
  const cabA = kit.box("records.cabinets.a", 0.18, 2.1, 8.3, mats.wallPanel, scene, root);
  cabA.position = new Vector3(-C.xHalf + 0.16, 1.15, 17.15);
  cabA.parent = cabNode;
  const cabB = kit.box("records.cabinets.b", 0.18, 2.1, 8.1, mats.wallPanel, scene, root);
  cabB.position = new Vector3(-C.xHalf + 0.16, 1.15, 26.95);
  cabB.parent = cabNode;
  // drawer grid on the bank face — the close-up read was one flat slab.
  // Merges into the static batches; anomalies overlay their own geometry.
  for (const y of [0.55, 0.95, 1.35, 1.75]) {
    for (const [zc, len] of [
      [17.15, 8.0],
      [26.95, 7.8],
    ] as const) {
      const hs = kit.box(`dress.cabseam.h.${y}.${zc}`, 0.014, 0.016, len, mats.rubber, scene, root);
      hs.position = new Vector3(-C.xHalf + 0.255, y, zc);
    }
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
    for (const z of [15.5, 18.5, 24.5, 27.5, 30.5]) {
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
  for (const [fc, flen] of [
    [17.15, 8.1],
    [26.95, 7.9],
  ] as const) {
    const fascia = kit.plane(`dress.cabfascia.${fc}`, flen, 0.17, fasciaMat, scene, root);
    fascia.position = new Vector3(-C.xHalf + 0.262, 2.0, fc);
    fascia.rotation.y = -Math.PI / 2;
  }
  colliders.push(
    kit.collider("records.col.a", 0.3, 2.2, 8.3, new Vector3(-C.xHalf + 0.18, 1.1, 17.15), scene, root),
    kit.collider("records.col.b", 0.3, 2.2, 8.1, new Vector3(-C.xHalf + 0.18, 1.1, 26.95), scene, root),
  );

  // ─── archives door + stacks room — the ARCHIVES fascia's promise ────
  // A glazed staff door recessed into the bank face (z 21.4–22.8 gap in
  // wall.left.1a/b + the bank split); behind it a real stacks room runs
  // west to x -4.4 — shelf run, archive boxes, a desk with a gooseneck
  // lamp. Sealed leaf by default; archives.open / archives.staffed work
  // it. The leaf's collider is parented to it so it swings with the leaf.
  {
    const DOOR_Z = 22.1;
    // header rail over the leaf; side jambs are built below with the
    // colliders — no solid frame box or the doorway is a steel slab
    const aframe = kit.box("archives.door.frame", 0.16, 0.12, 1.4, mats.steel, scene, root);
    aframe.position = new Vector3(-C.xHalf + 0.08, 2.06, DOOR_Z);
    registry.register("archives.door.frame", aframe);
    // no rubber slit insert — the room behind is real geometry; the
    // leaf + glazed pane alone close the gap when sealed
    // glazed leaf — steel frame slab + wired pane, like the gallery door
    const aleaf = kit.box("archives.door.leaf", 0.06, 2.02, 1.06, mats.door, scene, root);
    aleaf.position = new Vector3(-C.xHalf + 0.15, 1.01, DOOR_Z);
    registry.register("archives.door.leaf", aleaf);
    const apane = kit.plane("archives.door.pane", 0.5, 0.62, doorGlassMaterial(scene), scene);
    apane.parent = aleaf;
    apane.position = new Vector3(-0.032, 0.52, 0);
    apane.rotation.y = -Math.PI / 2;
    const apull = kit.box("archives.door.pull", 0.045, 0.34, 0.04, mats.steel, scene);
    apull.parent = aleaf;
    apull.position = new Vector3(-0.055, -0.02, 0.38);
    const aPlaque = kit.plane("archives.door.plaque", 0.3, 0.1, paperMaterial(scene), scene);
    aPlaque.parent = aleaf;
    aPlaque.position = new Vector3(-0.033, 0.28, 0);
    aPlaque.rotation.y = -Math.PI / 2;
    // leaf collider rides the leaf's swing
    kit.collider("archives.door.col", 0.08, 2.02, 1.06, new Vector3(0, 0, 0), scene, aleaf);
    // interior shell — concrete like the service spaces, always real
    const roomX0 = -C.xHalf; // -1.8 wall face
    const roomX1 = roomX0 - 2.55; // back face -4.35
    const roomZ0 = 21.42;
    const roomZ1 = 22.78;
    const roomC = { x: (roomX0 + roomX1) / 2, z: (roomZ0 + roomZ1) / 2 };
    const afloor = kit.box(
      "dress.archives.floor",
      roomX0 - roomX1 + 0.2,
      0.06,
      roomZ1 - roomZ0 + 0.24,
      mats.concrete,
      scene,
      root,
    );
    afloor.position = new Vector3(roomC.x, -0.02, roomC.z);
    const aceil = kit.box(
      "dress.archives.ceil",
      roomX0 - roomX1 + 0.2,
      0.08,
      roomZ1 - roomZ0 + 0.24,
      mats.concrete,
      scene,
      root,
    );
    aceil.position = new Vector3(roomC.x, 2.42, roomC.z);
    for (const [rz, tag] of [
      [roomZ0, "n"],
      [roomZ1, "s"],
    ] as const) {
      const rwall = kit.box(
        `dress.archives.wall.${tag}`,
        roomX0 - roomX1 + 0.2,
        2.5,
        0.1,
        mats.concrete,
        scene,
        root,
      );
      rwall.position = new Vector3(roomC.x, 1.22, rz);
      colliders.push(
        kit.collider(
          `archives.wallCol.${tag}`,
          roomX0 - roomX1 + 0.2,
          2.5,
          0.1,
          rwall.position.clone(),
          scene,
          root,
        ),
      );
    }
    const rback = kit.box("dress.archives.back", 0.1, 2.5, roomZ1 - roomZ0 + 0.2, mats.concrete, scene, root);
    rback.position = new Vector3(roomX1 - 0.02, 1.22, roomC.z);
    colliders.push(
      kit.collider(
        "archives.backCol",
        0.12,
        2.5,
        roomZ1 - roomZ0 + 0.24,
        rback.position.clone(),
        scene,
        root,
      ),
    );
    // shelf run along the south wall — two bays of archive shelving with
    // box stacks; a desk + gooseneck lamp against the back
    for (const sz of [roomZ1 - 0.22, roomZ0 + 0.22]) {
      const shelf = kit.box(`dress.archives.shelf.${sz}`, 1.9, 1.9, 0.34, mats.steel, scene, root);
      shelf.position = new Vector3(roomX0 - 1.15, 0.95, sz);
      colliders.push(
        kit.collider(`archives.shelfCol.${sz}`, 1.9, 1.95, 0.36, shelf.position.clone(), scene, root),
      );
      for (const sy of [0.35, 0.95, 1.55]) {
        const sboard = kit.box(`dress.archives.shelfB.${sz}.${sy}`, 1.84, 0.05, 0.3, cardMat, scene, root);
        sboard.position = new Vector3(roomX0 - 1.15, sy, sz);
      }
      for (let bi = 0; bi < 4; bi++) {
        const box = kit.box(
          `dress.archives.box.${sz}.${bi}`,
          0.3,
          0.26 + (bi % 2) * 0.08,
          0.24,
          bi % 2 ? cardMat : mats.wallPanel,
          scene,
          root,
        );
        box.position = new Vector3(roomX0 - 0.55 - bi * 0.42, 0.13 + (bi % 3) * 0.6, sz);
      }
    }
    const desk = kit.box("dress.archives.desk", 0.7, 0.74, 0.5, mats.rubber, scene, root);
    desk.position = new Vector3(roomX1 + 0.5, 0.37, roomZ0 + 0.32);
    colliders.push(kit.collider("archives.deskCol", 0.7, 0.78, 0.5, desk.position.clone(), scene, root));
    const lampArm = kit.box("dress.archives.lampArm", 0.05, 0.3, 0.05, mats.steel, scene, root);
    lampArm.position = new Vector3(roomX1 + 0.42, 0.95, roomZ0 + 0.26);
    const lampHeadMat = new StandardMaterial("mat.archives.lampHead", scene);
    lampHeadMat.diffuseColor = new Color3(0.1, 0.09, 0.07);
    lampHeadMat.emissiveColor = new Color3(0.16, 0.11, 0.05);
    lampHeadMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const lampHead = kit.box("dress.archives.lampHead", 0.16, 0.07, 0.1, lampHeadMat, scene, root);
    lampHead.position = new Vector3(roomX1 + 0.48, 1.08, roomZ0 + 0.3);
    // faint warm wash on the back wall — the lit-room read the doorway
    // needs even in baseline (a lamp left burning inside); unlit mat so
    // it survives zone kills looking like real spill, not a light bug
    const awash = new StandardMaterial("mat.archives.wash", scene);
    awash.diffuseColor = new Color3(0.32, 0.24, 0.13);
    awash.emissiveColor = new Color3(0.2, 0.14, 0.06);
    awash.specularColor = new Color3(0, 0, 0);
    const awashP = kit.plane("dress.archives.wash", roomZ1 - roomZ0 - 0.1, 1.9, awash, scene, root);
    awashP.position = new Vector3(roomX1 + 0.045, 1.15, roomC.z);
    awashP.rotation.y = Math.PI / 2;
    // lit floor pad just inside the mouth — through the door gap the
    // room reads as a lit interior instead of a painted back wall
    const apadMat = new StandardMaterial("mat.archives.pad", scene);
    apadMat.diffuseColor = new Color3(0.4, 0.3, 0.16);
    apadMat.emissiveColor = new Color3(0.24, 0.17, 0.07);
    apadMat.specularColor = new Color3(0, 0, 0);
    const apad = kit.plane("dress.archives.pad", 1.5, roomZ1 - roomZ0 - 0.08, apadMat, scene, root);
    apad.position = new Vector3(roomX0 - 0.85, 0.015, roomC.z);
    apad.rotation.x = -Math.PI / 2;
    apad.rotation.z = Math.PI / 2;
    // doorway jamb colliders — the gap's edges so the mouth is real
    for (const [jz, tag] of [
      [21.4, "n"],
      [22.8, "s"],
    ] as const) {
      const jamb = kit.box(`dress.archives.jamb.${tag}`, 0.2, 2.1, 0.14, mats.steel, scene, root);
      jamb.position = new Vector3(-C.xHalf + 0.08, 1.05, jz);
      colliders.push(
        kit.collider(`archives.jambCol.${tag}`, 0.22, 2.1, 0.14, jamb.position.clone(), scene, root),
      );
    }
  }

  // ─── staff room — a locker room behind the east clinic stretch ────
  // Glazed STAFF door at z 39.2–40.6 cut into wall.right.2a/b; behind
  // it a real room runs east to x 4.15 — locker bank, bench, hooks,
  // caged lamp. Sealed leaf by default; staffroom.* anomalies work it.
  // Leaf collider is parented to the leaf so it swings with the door.
  {
    const SRD_Z = (SR_Z0 + SR_Z1) / 2; // 39.9 — door centre
    const SR_LEAF_X = C.xHalf - 0.15;
    const srframe = kit.box("staffroom.door.frame", 0.16, 0.12, SR_Z1 - SR_Z0, mats.steel, scene, root);
    srframe.position = new Vector3(C.xHalf - 0.08, 2.06, SRD_Z);
    registry.register("staffroom.door.frame", srframe);
    const srleaf = kit.box("staffroom.door.leaf", 0.06, 2.02, 1.06, mats.door, scene, root);
    srleaf.position = new Vector3(SR_LEAF_X, 1.01, SRD_Z);
    registry.register("staffroom.door.leaf", srleaf);
    const srpane = kit.plane("staffroom.door.pane", 0.5, 0.62, doorGlassMaterial(scene), scene);
    srpane.parent = srleaf;
    srpane.position = new Vector3(0.032, 0.52, 0);
    srpane.rotation.y = Math.PI / 2;
    const srpull = kit.box("staffroom.door.pull", 0.045, 0.34, 0.04, mats.steel, scene);
    srpull.parent = srleaf;
    srpull.position = new Vector3(0.055, -0.02, -0.38);
    const srPlaque = kit.plane("staffroom.door.plaque", 0.3, 0.1, paperMaterial(scene), scene);
    srPlaque.parent = srleaf;
    srPlaque.position = new Vector3(0.033, 0.28, 0);
    srPlaque.rotation.y = Math.PI / 2;
    kit.collider("staffroom.door.col", 0.08, 2.02, 1.06, new Vector3(0, 0, 0), scene, srleaf);
    // interior shell — concrete service space, mirrored from archives
    const srX0 = C.xHalf; // 1.8 wall face
    const srX1 = srX0 + 2.35; // back face 4.15
    const srZ0 = SR_Z0 + 0.08;
    const srZ1 = SR_Z1 - 0.08;
    const srC = { x: (srX0 + srX1) / 2, z: (srZ0 + srZ1) / 2 };
    const srfloor = kit.box(
      "dress.staffroom.floor",
      srX1 - srX0 + 0.2,
      0.06,
      srZ1 - srZ0 + 0.24,
      mats.concrete,
      scene,
      root,
    );
    srfloor.position = new Vector3(srC.x, -0.02, srC.z);
    const srceil = kit.box(
      "dress.staffroom.ceil",
      srX1 - srX0 + 0.2,
      0.08,
      srZ1 - srZ0 + 0.24,
      mats.concrete,
      scene,
      root,
    );
    srceil.position = new Vector3(srC.x, 2.42, srC.z);
    for (const [rz, tag] of [
      [srZ0, "n"],
      [srZ1, "s"],
    ] as const) {
      const rwall = kit.box(
        `dress.staffroom.wall.${tag}`,
        srX1 - srX0 + 0.2,
        2.5,
        0.1,
        mats.concrete,
        scene,
        root,
      );
      rwall.position = new Vector3(srC.x, 1.22, rz);
      colliders.push(
        kit.collider(
          `staffroom.wallCol.${tag}`,
          srX1 - srX0 + 0.2,
          2.5,
          0.1,
          rwall.position.clone(),
          scene,
          root,
        ),
      );
    }
    const srback = kit.box("dress.staffroom.back", 0.1, 2.5, srZ1 - srZ0 + 0.2, mats.concrete, scene, root);
    srback.position = new Vector3(srX1 + 0.02, 1.22, srC.z);
    colliders.push(
      kit.collider("staffroom.backCol", 0.12, 2.5, srZ1 - srZ0 + 0.24, srback.position.clone(), scene, root),
    );
    // locker bank along the back wall — five steel units with vents,
    // one door the locker.* anomalies can swing on its own copy
    const lockerRow = new TransformNode("staffroom.lockers", scene);
    lockerRow.parent = root;
    registry.register("staffroom.lockers", lockerRow);
    for (let li = 0; li < 5; li++) {
      const lz = srZ0 + 0.24 + li * 0.34;
      const lk = kit.box(`dress.staffroom.locker.${li}`, 0.36, 1.9, 0.3, mats.steel, scene);
      lk.parent = lockerRow;
      lk.position = new Vector3(srX1 - 0.22, 0.95, lz);
      for (const vy of [0.62, 0.68, 0.74]) {
        const vent = kit.box(`dress.staffroom.locker.${li}.vent${vy}`, 0.02, 0.02, 0.2, mats.rubber, scene);
        vent.parent = lockerRow;
        vent.position = new Vector3(srX1 - 0.42, 1.55 + (vy - 0.68), lz);
      }
      const lhandle = kit.box(`dress.staffroom.locker.${li}.handle`, 0.03, 0.09, 0.03, mats.rubber, scene);
      lhandle.parent = lockerRow;
      lhandle.position = new Vector3(srX1 - 0.42, 0.98, lz + 0.1);
    }
    colliders.push(
      kit.collider(
        "staffroom.lockerCol",
        0.4,
        1.95,
        5 * 0.34 + 0.2,
        new Vector3(srX1 - 0.22, 0.95, srZ0 + 0.24 + 2 * 0.34),
        scene,
        root,
      ),
    );
    // bench mid-room + wall hooks, one bag hanging
    const bench = kit.box("dress.staffroom.bench", 1.1, 0.42, 0.34, mats.rubber, scene, root);
    bench.position = new Vector3(srX0 + 1.1, 0.21, srZ1 - 0.32);
    colliders.push(kit.collider("staffroom.benchCol", 1.1, 0.45, 0.36, bench.position.clone(), scene, root));
    for (let hi = 0; hi < 4; hi++) {
      const hook = kit.box(`dress.staffroom.hook.${hi}`, 0.03, 0.05, 0.03, mats.steel, scene, root);
      hook.position = new Vector3(srX0 + 0.06, 1.62, srZ0 + 0.18 + hi * 0.3);
    }
    const bag = kit.box("dress.staffroom.bag", 0.14, 0.26, 0.18, mats.rubber, scene, root);
    bag.position = new Vector3(srX0 + 0.14, 1.44, srZ0 + 0.48);
    // caged lamp + wash/pad — the lit-room read like the archives
    const lampCage = kit.box("dress.staffroom.lampCage", 0.14, 0.16, 0.14, mats.steel, scene, root);
    lampCage.position = new Vector3(srX1 - 0.12, 2.3, srC.z);
    const lampCoreMat = new StandardMaterial("mat.staffroom.lampCore", scene);
    lampCoreMat.diffuseColor = new Color3(0.1, 0.09, 0.07);
    lampCoreMat.emissiveColor = new Color3(0.2, 0.14, 0.06);
    lampCoreMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const lampCore = kit.box("dress.staffroom.lampCore", 0.1, 0.1, 0.1, lampCoreMat, scene, root);
    lampCore.position = new Vector3(srX1 - 0.14, 2.3, srC.z);
    const srwash = new StandardMaterial("mat.staffroom.wash", scene);
    srwash.diffuseColor = new Color3(0.3, 0.22, 0.12);
    srwash.emissiveColor = new Color3(0.18, 0.13, 0.05);
    srwash.specularColor = new Color3(0, 0, 0);
    const srwashP = kit.plane("dress.staffroom.wash", srZ1 - srZ0 - 0.1, 1.9, srwash, scene, root);
    srwashP.position = new Vector3(srX1 - 0.045, 1.15, srC.z);
    srwashP.rotation.y = -Math.PI / 2;
    const srpadMat = new StandardMaterial("mat.staffroom.pad", scene);
    srpadMat.diffuseColor = new Color3(0.38, 0.29, 0.15);
    srpadMat.emissiveColor = new Color3(0.22, 0.16, 0.06);
    srpadMat.specularColor = new Color3(0, 0, 0);
    const srpad = kit.plane("dress.staffroom.pad", 1.5, srZ1 - srZ0 - 0.08, srpadMat, scene, root);
    srpad.position = new Vector3(srX0 + 0.85, 0.015, srC.z);
    srpad.rotation.x = -Math.PI / 2;
    srpad.rotation.z = Math.PI / 2;
    for (const [jz, tag] of [
      [SR_Z0, "n"],
      [SR_Z1, "s"],
    ] as const) {
      const jamb = kit.box(`dress.staffroom.jamb.${tag}`, 0.2, 2.1, 0.14, mats.steel, scene, root);
      jamb.position = new Vector3(C.xHalf - 0.08, 1.05, jz);
      colliders.push(
        kit.collider(`staffroom.jambCol.${tag}`, 0.22, 2.1, 0.14, jamb.position.clone(), scene, root),
      );
    }
  }

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
  for (const jz of [15.05, 15.95]) {
    const sj = kit.box(`service.door.jamb.${jz}`, 0.14, 2.2, 0.12, mats.steel, scene, root);
    sj.position = new Vector3(C.xHalf - 0.07, 1.1, jz);
    registry.register(`service.door.jamb.${jz}`, sj);
  }
  const sframe = kit.box("service.door.frame", 0.14, C.height - 2.06, 1.0, mats.steel, scene, root);
  sframe.position = new Vector3(C.xHalf - 0.07, 2.06 + (C.height - 2.06) / 2, 15.5);
  const sslit = kit.box("service.door.slit", 0.02, 2.05, 0.8, mats.rubber, scene, root);
  sslit.position = new Vector3(C.xHalf - 0.1, 1.02, 15.5);
  const sleaf = kit.box("service.door.leaf", 0.06, 2.1, 0.88, mats.door, scene, root);
  sleaf.position = new Vector3(C.xHalf - 0.12, 1.05, 15.5);
  registry.register("service.door.frame", sframe);
  registry.register("service.door.leaf", sleaf);
  registry.register("service.door.slit", sslit);
  // leaf collider owns the doorway until service.stairwell/door.ajar opens it
  kit.collider("service.door.col", 0.08, 2.02, 0.94, new Vector3(0, 0, 0), scene, sleaf);
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

  // ─── the wicket — a sealed fare line on the east entry stretch.
  // Four pedestals make three gate lanes against the wall, smoked
  // paddles shut for the night, lane lamps dark. A shuttered ROUTE 7
  // clerk desk mounts proud of the wall just past the row. Leaves,
  // lane lamps, and the booth's window/shutter/lamp register so
  // anomalies can own them; every static part is dress.* for the merge.
  {
    const gateGlassMat = new StandardMaterial("mat.gate.glass", scene);
    gateGlassMat.diffuseColor = new Color3(0.16, 0.12, 0.07);
    gateGlassMat.specularColor = new Color3(0.04, 0.04, 0.04);
    gateGlassMat.alpha = 0.55;
    const GATE_X = 1.26; // pedestal line centre — row spans x0.77→1.75
    const PED_H = 0.95;
    for (const [pi, pz] of [5.0, 6.6, 8.2, 9.8].entries()) {
      const body = kit.box(`dress.gate.ped.${pi}`, 0.98, PED_H, 0.26, mats.wallPanel, scene, root);
      body.position = new Vector3(GATE_X, PED_H / 2, pz);
      const kick = kit.box(`dress.gate.kick.${pi}`, 0.98, 0.07, 0.28, mats.rubber, scene, root);
      kick.position = new Vector3(GATE_X, 0.035, pz);
      const pedCap = kit.box(`dress.gate.cap.${pi}`, 1.0, 0.04, 0.28, mats.rubber, scene, root);
      pedCap.position = new Vector3(GATE_X, PED_H + 0.02, pz);
      const pad = kit.box(`dress.gate.pad.${pi}`, 0.2, 0.015, 0.16, mats.rubber, scene, root);
      pad.position = new Vector3(GATE_X + 0.28, PED_H + 0.045, pz - 0.03);
    }
    for (const [li, lz] of [5.8, 7.4, 9.0].entries()) {
      // lane lamp on the south pedestal's top at the lane mouth — dark
      // tonight; per-lane material so an anomaly can light ONE only
      const lampMat = new StandardMaterial(`mat.gate.lamp.${li}`, scene);
      lampMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
      lampMat.specularColor = Color3.Black();
      lampMat.emissiveColor = new Color3(0.015, 0.015, 0.015);
      const lamp = kit.box(`gate.lamp.${li}`, 0.16, 0.015, 0.07, lampMat, scene, root);
      lamp.position = new Vector3(GATE_X + 0.3, PED_H + 0.048, lz + 0.72);
      registry.register(`gate.lamp.${li}`, lamp);
      // shut paddles: north leaf hinges off the north pedestal's face,
      // south off the south — they meet a hand's width shy of mid-lane
      for (const [side, hingeZ, sgn] of [
        ["n", lz - 0.67, 1],
        ["s", lz + 0.67, -1],
      ] as const) {
        const leaf = new TransformNode(`gate.leaf.${li}.${side}`, scene);
        leaf.parent = root;
        leaf.position = new Vector3(GATE_X, 0.62, hingeZ);
        const paddle = kit.box(`gate.leaf.${li}.${side}.paddle`, 0.025, 0.55, 0.6, gateGlassMat, scene, leaf);
        paddle.position = new Vector3(0, 0, sgn * 0.33);
        const rail = kit.box(`gate.leaf.${li}.${side}.rail`, 0.03, 0.035, 0.62, mats.rubber, scene, leaf);
        rail.position = new Vector3(0, 0.29, sgn * 0.33);
        registry.register(`gate.leaf.${li}.${side}`, leaf);
      }
      // one collider per lane — the wicket is shut tonight, nobody passes
      colliders.push(
        kit.collider(`gate.lane.col.${li}`, 1.0, 0.95, 1.3, new Vector3(GATE_X, PED_H / 2, lz), scene, root),
      );
      // tactile queue pad on the corridor side of each lane — thin box,
      // floor planes do not render in the corridor (arc16 trap)
      const queue = kit.box(`dress.wicket.queue.${li}`, 0.5, 0.012, 0.4, mats.domePad, scene, root);
      queue.position = new Vector3(0.55, 0.008, lz);
    }
    const wicketSignAnchor = new TransformNode("wicket.sign.anchor", scene);
    wicketSignAnchor.parent = root;
    wicketSignAnchor.position = new Vector3(1.0, 0, 7.4);
    kit.hangingSign("sign.wicket", mats, scene, wicketSignAnchor, registry, C.height);

    // ROUTE 7 clerk desk — a shallow booth mounted proud of the wall
    // north of the gates, its window down behind a roller shutter
    const booth = kit.box("dress.wicket.booth", 0.38, 2.3, 1.6, mats.wallPanel, scene, root);
    booth.position = new Vector3(1.61, 1.15, 12.5);
    const counter = kit.box("dress.wicket.counter", 0.16, 0.05, 1.0, mats.rubber, scene, root);
    counter.position = new Vector3(1.38, 1.02, 12.5);
    const winMat = new StandardMaterial("mat.wicket.win", scene);
    winMat.diffuseColor = new Color3(0.012, 0.012, 0.014);
    winMat.specularColor = new Color3(0.05, 0.05, 0.05);
    const win = kit.plane("wicket.win", 0.9, 0.75, winMat, scene, root);
    win.position = new Vector3(1.415, 1.52, 12.5);
    win.rotation.y = Math.PI / 2; // faces −x down the corridor
    registry.register("wicket.win", win);
    const shutterMat = new StandardMaterial("mat.wicket.shutter", scene);
    shutterMat.diffuseColor = new Color3(0.07, 0.075, 0.09);
    shutterMat.specularColor = new Color3(0.03, 0.03, 0.03);
    const shutter = kit.box("wicket.shutter", 0.02, 0.78, 0.94, shutterMat, scene, root);
    shutter.position = new Vector3(1.4, 1.52, 12.5);
    for (const sy of [-0.28, -0.14, 0, 0.14, 0.28]) {
      const slat = kit.box(`wicket.shutter.slat.${sy}`, 0.012, 0.035, 0.94, mats.rubber, scene, shutter);
      slat.position = new Vector3(-0.014, sy, 0);
    }
    registry.register("wicket.shutter", shutter);
    const boothLampMat = new StandardMaterial("mat.wicket.lamp", scene);
    boothLampMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    boothLampMat.specularColor = Color3.Black();
    boothLampMat.emissiveColor = new Color3(0.015, 0.015, 0.015);
    const blamp = kit.box("wicket.lamp", 0.12, 0.07, 0.5, boothLampMat, scene, root);
    blamp.position = new Vector3(1.37, 2.02, 12.5);
    registry.register("wicket.lamp", blamp);
    const bsign = kit.plane("sign.wicket.booth", 1.1, 0.28, mats.sign.get("sign.wicket.booth")!, scene, root);
    bsign.position = new Vector3(1.415, 2.28, 12.5);
    bsign.rotation.y = Math.PI / 2;
    colliders.push(
      kit.collider("wicket.booth.col", 0.4, 2.3, 1.62, new Vector3(1.61, 1.15, 12.5), scene, root),
    );
  }

  // ─── the supply cage — a recessed SUPPLY ISSUE service window in the
  //    east clinic stretch (mouth z 33.8–36.2). Solid lower wall +
  //    counter ledge, a bar grille above it, and a dim stock shelf
  //    inside that reads through the bars. Like the lift lobby's void:
  //    the grille never opens for the player — the mouth is always
  //    sealed — so anomalies animate the grille, not the space. ──────
  {
    const SUP_Z0 = 33.8;
    const SUP_Z1 = 36.2;
    const SUP_ZC = (SUP_Z0 + SUP_Z1) / 2;
    const SUP_D = 1.55; // recess depth
    const sback = C.xHalf + SUP_D; // interior back face x≈3.35
    // header + lintel over the mouth
    const supHeader = kit.box("dress.supply.header", 0.12, 0.5, 2.66, mats.wallPanel, scene, root);
    supHeader.position = new Vector3(C.xHalf, C.height - 0.25, SUP_ZC);
    const supLintel = kit.box("dress.supply.lintel", 0.06, 0.08, 2.68, mats.steel, scene, root);
    supLintel.position = new Vector3(C.xHalf - 0.06, 2.48, SUP_ZC);
    // recess cheeks
    for (const [i, cz] of [SUP_Z0, SUP_Z1].entries()) {
      const cheek = kit.box(`dress.supply.cheek.${i}`, SUP_D + 0.06, 2.5, 0.12, mats.wallPanel, scene, root);
      cheek.position = new Vector3(C.xHalf + SUP_D / 2, 1.25, cz);
    }
    // interior back wall + low recess ceiling + terrazzo continuing in
    const supBack = kit.box("dress.supply.back", 0.1, 2.5, 2.4, mats.wallPanel, scene, root);
    supBack.position = new Vector3(sback + 0.05, 1.25, SUP_ZC);
    const supCeil = kit.box("dress.supply.ceil", SUP_D, 0.08, 2.4, mats.wallPanel, scene, root);
    supCeil.position = new Vector3(C.xHalf + SUP_D / 2, 2.54, SUP_ZC);
    const supFloor = kit.box("dress.supply.floor", SUP_D + 0.04, 0.1, 2.4, mats.concrete, scene, root);
    supFloor.position = new Vector3(C.xHalf + SUP_D / 2, -0.05, SUP_ZC);
    // solid lower wall + counter ledge — the window sill reads as a
    // served hatch, not a doorway
    const sillWall = kit.box("dress.supply.sillwall", 0.1, 0.95, 2.4, mats.wallPanel, scene, root);
    sillWall.position = new Vector3(C.xHalf + 0.03, 0.475, SUP_ZC);
    const ledge = kit.box("dress.supply.ledge", 0.24, 0.05, 2.46, mats.rubber, scene, root);
    ledge.position = new Vector3(C.xHalf - 0.04, 0.98, SUP_ZC);
    // stock shelf inside the cage — three crates registered so the
    // anomalies can strip the shelf
    const shelf = kit.box("dress.supply.shelf", 0.5, 0.06, 2.0, mats.steel, scene, root);
    shelf.position = new Vector3(sback - 0.3, 1.15, SUP_ZC);
    const shelfLow = kit.box("dress.supply.shelf.low", 0.5, 0.06, 2.0, mats.steel, scene, root);
    shelfLow.position = new Vector3(sback - 0.3, 0.55, SUP_ZC);
    const crateMat = new StandardMaterial("mat.supply.crate", scene);
    crateMat.diffuseColor = new Color3(0.32, 0.24, 0.15);
    crateMat.specularColor = new Color3(0.06, 0.06, 0.06);
    for (const [ci, cz, cy, cw] of [
      [0, SUP_Z0 + 0.55, 0.75, 0.5],
      [1, SUP_Z0 + 1.3, 0.75, 0.44],
      [2, SUP_Z0 + 0.9, 1.32, 0.46],
    ] as const) {
      const crate = kit.box(`supply.crate.${ci}`, 0.4, 0.36, cw, crateMat, scene, root);
      crate.position = new Vector3(sback - 0.32, cy, cz);
      registry.register(`supply.crate.${ci}`, crate);
    }
    // the grille — vertical bars across the opening, registered node so
    // anomalies can slide it up; bars are children, NOT dress.* (merge
    // prefix would fold them into the static batch and kill animation)
    const grille = new TransformNode("supply.grille", scene);
    grille.parent = root;
    grille.position = new Vector3(C.xHalf - 0.02, 0, SUP_ZC);
    for (let b = 0; b < 23; b++) {
      const bar = kit.box(`supply.grille.bar.${b}`, 0.024, 1.5, 0.03, mats.steel, scene, grille);
      bar.position = new Vector3(0, 1.73, -1.15 + b * 0.105);
    }
    for (const ry of [1.1, 1.73, 2.36]) {
      const rail = kit.box(`supply.grille.rail.${ry}`, 0.05, 0.05, 2.34, mats.rubber, scene, grille);
      rail.position = new Vector3(0, ry, 0);
    }
    registry.register("supply.grille", grille);
    // mouth stays sealed forever — one collider across the opening
    colliders.push(
      kit.collider("supply.cage.col", 0.5, 2.6, 2.45, new Vector3(C.xHalf + 0.08, 1.3, SUP_ZC), scene, root),
    );
    // amber pilot lamp over the grille + SUPPLY ISSUE plate on the header
    const pilotMat = new StandardMaterial("mat.supply.pilot", scene);
    pilotMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    pilotMat.specularColor = Color3.Black();
    pilotMat.emissiveColor = new Color3(0.4, 0.28, 0.08);
    const pilot = kit.box("supply.pilot", 0.1, 0.06, 0.16, pilotMat, scene, root);
    pilot.position = new Vector3(C.xHalf - 0.1, 2.62, SUP_ZC - 1.05);
    registry.register("supply.pilot", pilot);
    const ssign = kit.plane("sign.supply", 1.4, 0.3, mats.sign.get("sign.supply")!, scene, root);
    ssign.position = new Vector3(C.xHalf - 0.065, 2.74, SUP_ZC + 0.5);
    ssign.rotation.y = Math.PI / 2;
    registry.register("sign.supply", ssign);
    // caged dome lamp inside the recess — unlit by default, the lit
    // anomalies wake it and pool light across the stock
    const cageLampMat = new StandardMaterial("mat.supply.lamp", scene);
    cageLampMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    cageLampMat.specularColor = Color3.Black();
    cageLampMat.emissiveColor = new Color3(0.015, 0.015, 0.015);
    const clamp = kit.box("supply.lamp", 0.16, 0.06, 0.16, cageLampMat, scene, root);
    clamp.position = new Vector3(sback - 0.12, 2.32, SUP_ZC);
    registry.register("supply.lamp", clamp);
    // baseline fill inside the cage — a recessed mouth with no interior
    // light reads as a black hole (the bars + stock vanish). Dim, and
    // pushed to the clinic zone's extraLights so zone dim/kill paths
    // carry it like every other fixture.
    const cageFill = new PointLight("supply.cageFill", new Vector3(sback - 0.6, 2.0, SUP_ZC), scene);
    cageFill.diffuse = new Color3(0.9, 0.78, 0.58);
    cageFill.intensity = 0.16;
    cageFill.range = 3.0;
    zones.find((z) => z.name === "clinic")?.extraLights.push(cageFill);
  }

  // ─── the colonnade — structural half-columns hugging both walls at a
  //    steady rhythm (z 16.5 / 33 / 43.5 / 52.5). Real concourses carry
  //    columns; without them the corridor reads as one flat tube. The
  //    columns are registered TransformNodes (col.{e|w}.{i}) so anomaly
  //    classes can delete, add, or scar them; caps/bases/plinths merge
  //    under dress.col.*. Mouth stretches (wicket, washroom, gallery,
  //    staff door, cage, lobby, bay) are all skipped by the z picks. ──
  {
    const COL_ZS = [16.5, 33, 43.5, 52.5];
    const COL_W = 0.6; // z width of the column face
    const COL_D = 0.3; // x protrusion from the wall
    for (const sx of [-1, 1]) {
      for (const [i, cz] of COL_ZS.entries()) {
        const col = new TransformNode(`col.${sx < 0 ? "w" : "e"}.${i}`, scene);
        col.parent = root;
        col.position = new Vector3(sx * (C.xHalf - COL_D / 2), 0, cz);
        const shaft = kit.box(
          `col.${sx < 0 ? "w" : "e"}.${i}.shaft`,
          COL_D,
          C.height,
          COL_W,
          mats.wallPanel,
          scene,
          col,
        );
        shaft.position = new Vector3(0, C.height / 2, 0);
        // darker plinth base + steel cap band — the column reads built,
        // not extruded
        const plinth = kit.box(
          `col.${sx < 0 ? "w" : "e"}.${i}.plinth`,
          COL_D + 0.04,
          0.16,
          COL_W + 0.04,
          mats.rubber,
          scene,
          col,
        );
        plinth.position = new Vector3(0, 0.08, 0);
        const cap = kit.box(
          `col.${sx < 0 ? "w" : "e"}.${i}.cap`,
          COL_D + 0.02,
          0.2,
          COL_W + 0.02,
          mats.steel,
          scene,
          col,
        );
        cap.position = new Vector3(0, C.height - 0.6, 0);
        registry.register(`col.${sx < 0 ? "w" : "e"}.${i}`, col);
        colliders.push(
          kit.collider(
            `col.${sx < 0 ? "w" : "e"}.${i}.col`,
            COL_D + 0.06,
            C.height,
            COL_W + 0.06,
            new Vector3(sx * (C.xHalf - COL_D / 2), C.height / 2, cz),
            scene,
            root,
          ),
        );
      }
    }
  }

  // ─── ceiling duct run — galvanized trunk line suspended under the
  // slab along the east tee edge, feeding three down-facing grates.
  // The corridor's air plant made visible; grate meshes register so
  // anomalies can own them (vents.crawl reads through one).
  {
    const duct = kit.box("dress.duct.run", 0.52, 0.32, 46, mats.steel, scene, root);
    duct.position = new Vector3(1.02, 2.78, 28);
    for (let sz = 7; sz < 51; sz += 5.75) {
      const seam = kit.box(`dress.duct.seam.${sz.toFixed(2)}`, 0.56, 0.34, 0.06, mats.steel, scene, root);
      seam.position = new Vector3(1.02, 2.78, sz);
    }
    for (const hz of [9, 28, 47]) {
      const strap = kit.box(`dress.duct.strap.${hz}`, 0.6, 0.06, 0.04, mats.steel, scene, root);
      strap.position = new Vector3(1.02, 2.97, hz);
    }
    for (const [gi, gz] of [12, 27, 42].entries()) {
      const gr = kit.box(`duct.grate.${gi}`, 0.3, 0.03, 0.68, mats.steel, scene, root);
      gr.position = new Vector3(1.02, 2.61, gz);
      for (let sl = 0; sl < 3; sl++) {
        const slat = kit.box(`duct.grate.${gi}.slat.${sl}`, 0.26, 0.012, 0.08, mats.rubber, scene, root);
        slat.position = new Vector3(1.02, 2.592, gz - 0.2 + sl * 0.2);
      }
      registry.register(`duct.grate.${gi}`, gr);
    }
  }

  // baseboard trim grounds the walls — west splits around the bay mouth
  for (const sx of [-1, 1]) {
    const spans: [number, number][] =
      sx < 0
        ? [
            [C.z0, BAY_Z0],
            [BAY_Z1, C.z1],
          ]
        : [
            [C.z0, 15.0],
            [16.0, WASH_Z0],
            // split at the supply cage mouth (z 33.8–36.2)
            [WASH_Z1, 33.8],
            [36.2, LOB_Z0],
            [LOB_Z1, C.z1],
          ];
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
        : [
            [C.z0, 15.0],
            [16.0, WASH_Z0],
            // split at the supply cage mouth (z 33.8–36.2)
            [WASH_Z1, 33.8],
            [36.2, LOB_Z0],
            [LOB_Z1, C.z1],
          ];
    spans.forEach(([s0, s1], i) => {
      const rail = kit.box(`dress.rail.${sx}${i ? ".s" : ""}`, 0.035, 0.09, s1 - s0, mats.steel, scene, root);
      rail.position = new Vector3(sx * (C.xHalf - 0.018), 1.04, (s0 + s1) / 2);
    });
  }

  // photoluminescent egress markers along the wall bases — green
  // running-man + chevron pointing at the nearest airlock, alternating
  // walls like a real tunnel strip. Registered per marker: a reversed
  // arrow is a ready-made divergence.
  const egressTex = (dir: 1 | -1): DynamicTexture => {
    const t = new DynamicTexture(`tex.egress.${dir}`, { width: 256, height: 96 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.fillStyle = "#1d7a48";
    c.fillRect(0, 0, 256, 96);
    c.strokeStyle = "rgba(235,255,240,0.9)";
    c.lineWidth = 5;
    c.strokeRect(7, 7, 242, 82);
    c.fillStyle = "#eafae9";
    c.strokeStyle = "#eafae9";
    c.lineWidth = 9;
    c.lineCap = "round";
    const mx = dir > 0 ? 84 : 172;
    c.beginPath();
    c.arc(mx, 32, 11, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(mx, 47);
    c.lineTo(mx + dir * 12, 70);
    c.stroke();
    c.beginPath();
    c.moveTo(mx + dir * 12, 70);
    c.lineTo(mx + dir * 28, 90);
    c.moveTo(mx + dir * 12, 70);
    c.lineTo(mx - dir * 8, 88);
    c.moveTo(mx, 51);
    c.lineTo(mx + dir * 20, 62);
    c.moveTo(mx, 51);
    c.lineTo(mx - dir * 12, 66);
    c.stroke();
    const ax = dir > 0 ? 176 : 80;
    c.beginPath();
    c.moveTo(ax - dir * 30, 48);
    c.lineTo(ax + dir * 30, 48);
    c.moveTo(ax + dir * 30, 48);
    c.lineTo(ax + dir * 12, 32);
    c.moveTo(ax + dir * 30, 48);
    c.lineTo(ax + dir * 12, 64);
    c.stroke();
    t.update();
    return t;
  };
  const egressMats = new Map<number, StandardMaterial>();
  for (const dir of [1, -1] as const) {
    const em = new StandardMaterial(`mat.egress.${dir}`, scene);
    const et = egressTex(dir);
    em.diffuseTexture = et;
    em.emissiveTexture = et;
    em.emissiveColor = new Color3(0.58, 0.74, 0.58);
    em.disableLighting = true;
    egressMats.set(dir, em);
  }
  // one continuous strip on the west wall like a real tunnel run —
  // mounted on the records bank face where the cabinets cover the wall
  // (z13–31, face −1.55), and broken only by the bay mouth. Wall face is
  // −1.74 → boards mount proud at −1.72; the bank's face takes −1.53.
  // Texture-right is +z (south) on the west wall under rotation.y=-π/2,
  // so dir = +1 draws the arrow south — point at the nearer airlock.
  const egressSpots: [number, number][] = [
    [10, -1.72],
    [15.5, -1.53],
    [19, -1.53],
    [24, -1.53],
    [30, -1.53],
    [32.6, -1.72],
    [36, -1.72],
    [41, -1.72],
    [45.5, -1.72],
    [52, -1.72],
  ];
  egressSpots.forEach(([ez, ex], i) => {
    const dir = ez < 28 ? -1 : 1; // dir=1 arrows +z (south), -1 arrows -z (north)
    const p = kit.plane(`dress.egress.${i}`, 0.5, 0.19, egressMats.get(dir)!, scene, root);
    p.rotation.y = -Math.PI / 2; // kit.plane faces -z at identity; -π/2 puts the face at +x
    p.position = new Vector3(ex, 0.4, ez);
    registry.register(`dress.egress.${i}`, p);
  });

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
      // dress.emlamp (no dot after eml) — dress.emlight. is a merge prefix;
      // anomalies swap these lamp materials so they must stay live meshes
      const lamp = kit.box(
        `dress.emlamp.${pz}.lamp${dz < 0 ? "a" : "b"}`,
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

  // wall-mounted fire extinguisher on the clinic stretch — red cylinder
  // on a steel bracket under a FIRE plaque; joins the safety-fixture
  // family (call points, hose cabinet, aid point) on the last thin run
  {
    const ex = CreateCylinder("dress.ext.body", { height: 0.46, diameter: 0.13, tessellation: 12 }, scene);
    ex.material = mats.cabinetRed;
    ex.position = new Vector3(-(C.xHalf - 0.14), 0.82, 42.4);
    ex.parent = root;
    registry.register("dress.ext.body", ex);
    const bracket = kit.box("dress.ext.bracket", 0.05, 0.1, 0.16, mats.steel, scene, root);
    bracket.position = new Vector3(-(C.xHalf - 0.07), 1.02, 42.4);
    const exValve = kit.box("dress.ext.valve", 0.05, 0.05, 0.05, mats.steel, scene, root);
    exValve.position = new Vector3(-(C.xHalf - 0.14), 1.08, 42.4);
    const exNozzle = kit.box("dress.ext.nozzle", 0.02, 0.16, 0.03, mats.rubber, scene, root);
    exNozzle.position = new Vector3(-(C.xHalf - 0.14), 1.02, 42.49);
    const fireTex = new DynamicTexture("tex.extsign", { width: 128, height: 96 }, scene, true);
    {
      const c = fireTex.getContext() as unknown as CanvasRenderingContext2D;
      c.fillStyle = "#8e2020";
      c.fillRect(0, 0, 128, 96);
      c.fillStyle = "#e8e2d5";
      c.font = "bold 36px sans-serif";
      c.textAlign = "center";
      c.fillText("FIRE", 64, 58);
      fireTex.update();
    }
    const fireMat = new StandardMaterial("mat.extsign", scene);
    fireMat.diffuseTexture = fireTex;
    fireMat.emissiveTexture = fireTex;
    fireMat.emissiveColor = new Color3(0.5, 0.5, 0.48);
    fireMat.opacityTexture = fireTex;
    fireMat.disableLighting = false;
    const exSign = kit.plane("dress.ext.sign", 0.22, 0.16, fireMat, scene, root);
    exSign.position = new Vector3(-(C.xHalf - 0.02), 1.85, 42.4);
    exSign.rotation.y = Math.PI / 2;
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

  // service-corner vignette at the junction end of the east wall — a
  // low pallet of spare panels + a leaning pole; floor dressing only
  for (let i = 0; i < 4; i++) {
    const slab = kit.box(`dress.pallet.slab.${i}`, 0.52, 0.035, 0.44, mats.wallPanel, scene, root);
    slab.position = new Vector3(C.xHalf - 0.5, 0.035 + i * 0.037, 53.4);
    slab.rotation.y = i % 2 ? 0.05 : -0.04;
  }
  const pole = kit.box("dress.pole", 0.025, 1.7, 0.025, mats.steel, scene, root);
  pole.position = new Vector3(C.xHalf - 0.2, 0.85, 53.95);
  pole.rotation.z = -0.3; // top rests against the wall face
  const mopHead = kit.box("dress.mophead", 0.09, 0.12, 0.05, mats.rubber, scene, root);
  mopHead.position = new Vector3(C.xHalf - 0.44, 0.06, 53.95);
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
        : [
            [C.z0, 15.0],
            [16.0, WASH_Z0],
            [WASH_Z1, LOB_Z0],
            [LOB_Z1, C.z1],
          ];
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
      if (sx > 0 && z > LOB_Z0 - 0.5 && z < LOB_Z1 + 0.5) continue; // same over the lift lobby
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

  // fire standpipe — the red pipe every Japanese station service
  // corridor runs along the ceiling; east side below the cable tray,
  // same doorway splits as the tray, flanged joints, two hose-valve
  // drops the anomalies can work
  const pipeMat = new StandardMaterial("mat.pipe.red", scene);
  pipeMat.diffuseColor = new Color3(0.34, 0.055, 0.04);
  pipeMat.specularColor = new Color3(0.14, 0.07, 0.06);
  pipeMat.specularPower = 30;
  const pipeX = C.xHalf - 0.42;
  const pipeY = 2.56;
  const pipeSpans: [number, number][] = [
    [C.z0 + 0.4, 15.0],
    [16.0, WASH_Z0],
    [WASH_Z1, LOB_Z0],
    [LOB_Z1, C.z1 - 0.4],
  ];
  pipeSpans.forEach(([s0, s1], i) => {
    const seg = CreateCylinder(
      `pipe.stand.${i}`,
      { height: s1 - s0, diameter: 0.09, tessellation: 14 },
      scene,
    );
    seg.material = pipeMat;
    seg.parent = root;
    seg.position = new Vector3(pipeX, pipeY, (s0 + s1) / 2);
    seg.rotation.x = Math.PI / 2;
    registry.register(`pipe.stand.${i}`, seg);
    // flange collar at the span's north joint face
    const fl = CreateCylinder(`pipe.flange.${i}`, { height: 0.055, diameter: 0.13, tessellation: 14 }, scene);
    fl.material = pipeMat;
    fl.parent = root;
    fl.position = new Vector3(pipeX, pipeY, s0 + 0.03);
    fl.rotation.x = Math.PI / 2;
    registry.register(`pipe.flange.${i}`, fl);
  });
  // mid-run flanges where a long span would really joint
  for (const fz of [27.2, 40.8]) {
    const fl = CreateCylinder(
      `pipe.flange.m${Math.round(fz)}`,
      { height: 0.055, diameter: 0.13, tessellation: 14 },
      scene,
    );
    fl.material = pipeMat;
    fl.parent = root;
    fl.position = new Vector3(pipeX, pipeY, fz);
    fl.rotation.x = Math.PI / 2;
    registry.register(`pipe.flange.m${Math.round(fz)}`, fl);
  }
  // pipe hanger straps up to the tray line
  for (let z = 5; z < C.z1 - 1; z += 5.5) {
    const hp = kit.box(`dress.pipehang.${z.toFixed(1)}`, 0.025, 0.3, 0.11, mats.steel, scene, root);
    hp.position = new Vector3(pipeX, pipeY + 0.19, z);
  }
  // two hose-valve drops — a short down-leg to a wheel at reach height
  for (const [vi, vz] of [22.6, 44.2].entries()) {
    const drop = CreateCylinder(
      `pipe.vdrop.${vi}`,
      { height: 1.3, diameter: 0.055, tessellation: 10 },
      scene,
    );
    drop.material = pipeMat;
    drop.parent = root;
    drop.position = new Vector3(pipeX + 0.02, pipeY - 0.65, vz);
    const valve = new TransformNode(`pipe.valve.${vi}`, scene);
    valve.parent = root;
    valve.position = new Vector3(pipeX + 0.02, pipeY - 1.32, vz);
    registry.register(`pipe.valve.${vi}`, valve);
    const wheel = CreateCylinder(
      `pipe.valve.${vi}.wheel`,
      { height: 0.022, diameter: 0.17, tessellation: 12 },
      scene,
    );
    wheel.material = pipeMat;
    wheel.parent = valve;
    wheel.rotation.x = Math.PI / 2; // wheel face out toward the corridor
    for (let s = 0; s < 3; s++) {
      const spoke = kit.box(`pipe.valve.${vi}.spoke.${s}`, 0.012, 0.012, 0.16, mats.steel, scene, valve);
      spoke.rotation.y = (s * Math.PI) / 3;
    }
    const hub = CreateCylinder(
      `pipe.valve.${vi}.hub`,
      { height: 0.05, diameter: 0.04, tessellation: 8 },
      scene,
    );
    hub.material = mats.steel;
    hub.parent = valve;
    hub.rotation.x = Math.PI / 2;
  }

  // trench drain — a continuous grated channel along the west wall
  // base (trench drains cross thresholds; the bay mouth keeps it too)
  const drainTex = new DynamicTexture("tex.drain.channel", { width: 1024, height: 64 }, scene, false);
  {
    const dctx = drainTex.getContext();
    dctx.fillStyle = "#14161a";
    dctx.fillRect(0, 0, 1024, 64);
    dctx.fillStyle = "#1d2024";
    dctx.fillRect(0, 8, 1024, 48);
    dctx.fillStyle = "#0a0b0d";
    for (let x = 6; x < 1024; x += 22) dctx.fillRect(x, 10, 7, 44);
    dctx.fillStyle = "rgba(96,88,72,0.28)";
    dctx.fillRect(0, 0, 1024, 6);
    dctx.fillRect(0, 58, 1024, 6);
    drainTex.update();
  }
  const drainMat = new StandardMaterial("mat.drain.channel", scene);
  drainMat.diffuseTexture = drainTex;
  drainMat.specularColor = new Color3(0.03, 0.03, 0.03);
  const drainCh = kit.plane("drain.channel", 0.24, C.z1 - C.z0 - 0.8, drainMat, scene, root);
  drainCh.position = new Vector3(-(C.xHalf - 0.17), 0.009, (C.z0 + C.z1) / 2);
  drainCh.rotation.x = -Math.PI / 2;
  registry.register("drain.channel", drainCh);

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

  // ─── maintenance workbench — the west wall hugging the bay mouth
  // (z≈44.5–46.1) reads as the bay's working bench: fold-down bench,
  // pegboard with painted tool shadows (one hook empty), cable spool,
  // task lamp
  {
    const benchZ = 45.3;
    const wtop = kit.box("dress.bench.top", 0.56, 0.06, 1.6, mats.steel, scene, root);
    wtop.position = new Vector3(-C.xHalf + 0.32, 0.86, benchZ);
    for (const dz of [-0.68, 0.68]) {
      const leg = kit.box(`dress.bench.leg.${dz}`, 0.05, 0.84, 0.05, mats.steel, scene, root);
      leg.position = new Vector3(-C.xHalf + 0.52, 0.42, benchZ + dz);
      const wallLeg = kit.box(`dress.bench.wleg.${dz}`, 0.04, 0.84, 0.04, mats.steel, scene, root);
      wallLeg.position = new Vector3(-C.xHalf + 0.08, 0.42, benchZ + dz);
    }
    colliders.push(
      kit.collider(
        "dress.bench.col",
        0.62,
        0.9,
        1.7,
        new Vector3(-C.xHalf + 0.32, 0.45, benchZ),
        scene,
        root,
      ),
    );
    // pegboard — dark hardboard, peg holes, four tool shadows; the
    // centre hook's tool is gone, its outline left behind
    const pegTex = new DynamicTexture("tex.pegboard", { width: 384, height: 256 }, scene, true);
    const pc = pegTex.getContext() as unknown as CanvasRenderingContext2D;
    pc.scale(3, 3);
    pc.fillStyle = "#2b2e31";
    pc.fillRect(0, 0, 128, 85);
    pc.fillStyle = "#1b1d1f";
    for (let y = 6; y < 82; y += 8) for (let x = 6; x < 126; x += 8) pc.fillRect(x, y, 1.4, 1.4);
    pc.strokeStyle = "#8f969b";
    pc.lineWidth = 1.6;
    // wrench
    pc.strokeRect(10, 14, 6, 34);
    pc.beginPath();
    pc.arc(13, 10, 6, Math.PI * 0.7, Math.PI * 1.7);
    pc.stroke();
    // hammer
    pc.strokeRect(34, 16, 5, 30);
    pc.strokeRect(30, 10, 14, 8);
    // snips
    pc.beginPath();
    pc.moveTo(62, 44);
    pc.lineTo(68, 12);
    pc.lineTo(73, 44);
    pc.moveTo(62, 44);
    pc.quadraticCurveTo(67, 52, 73, 44);
    pc.stroke();
    // empty hook — the missing fourth tool's dashed outline
    pc.setLineDash([3, 3]);
    pc.strokeStyle = "#565c61";
    pc.strokeRect(96, 16, 7, 30);
    pc.setLineDash([]);
    pc.fillStyle = "#565c61";
    pc.fillRect(97, 12, 5, 3);
    pc.font = "5px monospace";
    pc.fillText("SPARE", 95, 56);
    pegTex.update();
    const pegMat = new StandardMaterial("mat.pegboard", scene);
    pegMat.diffuseTexture = pegTex;
    pegMat.emissiveTexture = pegTex;
    pegMat.emissiveColor = new Color3(0.55, 0.55, 0.5);
    pegMat.specularColor = new Color3(0.02, 0.02, 0.02);
    const peg = kit.plane("dress.bench.pegboard", 1.5, 0.95, pegMat, scene, root);
    peg.position = new Vector3(-C.xHalf + 0.065, 1.62, benchZ);
    peg.rotation.y = -Math.PI / 2;
    // shelf + clipped task lamp, faint warm glow under it
    const wshelf = kit.box("dress.bench.shelf", 0.32, 0.04, 1.2, mats.steel, scene, root);
    wshelf.position = new Vector3(-C.xHalf + 0.18, 2.24, benchZ);
    const lampShell = kit.box("dress.bench.lampshell", 0.12, 0.08, 0.1, mats.steel, scene, root);
    lampShell.position = new Vector3(-C.xHalf + 0.18, 2.16, benchZ - 0.32);
    const benchLampMat = new StandardMaterial("mat.benchlamp", scene);
    benchLampMat.diffuseColor = new Color3(0.3, 0.24, 0.14);
    benchLampMat.emissiveColor = new Color3(0.5, 0.38, 0.2);
    const lampGlow = kit.box("dress.bench.lampglow", 0.08, 0.025, 0.06, benchLampMat, scene, root);
    lampGlow.position = new Vector3(-C.xHalf + 0.18, 2.11, benchZ - 0.32);
    // cable spool under the bench — wound drum on an axle
    const spool = CreateCylinder(
      "dress.bench.spool",
      { diameter: 0.5, height: 0.34, tessellation: 18 },
      scene,
    );
    spool.material = mats.rubber;
    spool.rotation.z = Math.PI / 2;
    spool.position = new Vector3(-C.xHalf + 0.34, 0.26, benchZ + 0.42);
    const spoolAxle = kit.box("dress.bench.saxle", 0.05, 0.5, 0.05, mats.steel, scene, root);
    spoolAxle.position = new Vector3(-C.xHalf + 0.34, 0.25, benchZ + 0.42);
    // hand tools left on the bench
    const wRng = new RngStream("loop.dressing", runSeed, "workbench");
    for (let i = 0; i < 4; i++) {
      const tool = kit.box(
        `dress.bench.tool.${i}`,
        wRng.range(0.06, 0.16),
        0.025,
        wRng.range(0.03, 0.07),
        i === 3 ? mats.rubber : mats.steel,
        scene,
        root,
      );
      tool.position = new Vector3(-C.xHalf + wRng.range(0.14, 0.5), 0.9, benchZ + wRng.range(-0.62, 0.62));
      tool.rotation.y = wRng.range(0, Math.PI);
    }
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
        : [
            [C.z0, 15.0],
            [16.0, WASH_Z0],
            [WASH_Z1, LOB_Z0],
            [LOB_Z1, C.z1],
          ];
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
    // junction.pipeN (no dot) — junction.pipe. is a merge prefix; a
    // registered mesh folded into a batch leaves anomalies animating air
    const pipe = kit.box(`junction.pipe${i}`, 0.07, 0.07, 2.9, mats.steel, scene, root);
    pipe.position = new Vector3(-C.xHalf - BAY_DEPTH + 0.1, C.height - 0.4 - i * 0.12, BAY_ZC);
    registry.register(`junction.pipe${i}`, pipe);
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

  // ─── clinic intake room — a lit alcove BEHIND the shuttered counter,
  // kept disabled until clinic.staffed swaps wall.left.2 for stubs and
  // rolls the shutter up. The room cannot exist; that is the anomaly. ─
  const clinicRoom = new TransformNode("anomaly.clinic.room", scene);
  clinicRoom.parent = root;
  {
    // interior reuses the corridor's own textured PBRs — same institution
    // inside and out, and proven under the zone lighting that spills
    // through the window (flat pale StandardMaterials bloom to white here)
    const clinicWall = mats.wallPanel;
    const clinicFloor = mats.concrete;
    const cx0 = -3.32;
    const cx1 = -1.78;
    const cz0 = 34.9;
    const cz1 = 39.1;
    const cm = (
      name: string,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      m: Material = clinicWall,
    ) => {
      const b = kit.box(name, w, h, d, m, scene, clinicRoom);
      b.position = new Vector3(x, y, z);
      return b;
    };
    cm(
      "anomaly.clinic.floor",
      cx1 - cx0 + 0.12,
      0.08,
      cz1 - cz0 + 0.12,
      (cx0 + cx1) / 2,
      -0.02,
      37,
      clinicFloor,
    );
    cm(
      "anomaly.clinic.ceil",
      cx1 - cx0 + 0.12,
      0.08,
      cz1 - cz0 + 0.12,
      (cx0 + cx1) / 2,
      2.94,
      37,
      clinicFloor,
    );
    cm("anomaly.clinic.back", 0.08, 3.0, cz1 - cz0 + 0.12, cx0 - 0.02, 1.5, 37);
    cm("anomaly.clinic.side.0", cx1 - cx0 + 0.12, 3.0, 0.08, (cx0 + cx1) / 2, 1.5, cz0 - 0.02);
    cm("anomaly.clinic.side.1", cx1 - cx0 + 0.12, 3.0, 0.08, (cx0 + cx1) / 2, 1.5, cz1 + 0.02);
    // desk against the back wall — the workstation the figure faces
    cm("anomaly.clinic.desk", 0.5, 0.78, 1.7, cx0 + 0.35, 0.39, 37, galEnamel);
    cm("anomaly.clinic.desklamp", 0.06, 0.28, 0.06, cx0 + 0.3, 0.92, 37.55, mats.steel);
    cm("anomaly.clinic.lampshade", 0.18, 0.07, 0.12, cx0 + 0.3, 1.08, 37.55, mats.trofferDim);
    // shelving + boxed stores on the south side
    cm("anomaly.clinic.shelf", 0.28, 0.04, 1.4, cx0 + 0.8, 1.8, cz1 - 0.45, galEnamel);
    for (let i = 0; i < 3; i++) {
      cm(
        `anomaly.clinic.box.${i}`,
        0.2,
        0.16 + i * 0.02,
        0.3,
        cx0 + 0.8,
        1.9 + i * 0.02,
        cz1 - 0.85 + i * 0.4,
        clinicFloor,
      );
    }
    // half-drawn screen partition near the north corner
    cm("anomaly.clinic.screen", 0.05, 1.7, 0.9, cx0 + 1.05, 0.85, cz0 + 0.55, galEnamel);
    // ceiling troffer shell — clinicLamp does the real work
    const ct = cm("anomaly.clinic.troffer", 0.5, 0.04, 1.2, -2.5, 2.9, 37);
    ct.material = mats.trofferLit;
    // the seated figure — same primitive anatomy as the gallery sitter,
    // facing the desk (-x): its back to the shuttered window
    const fm = mats.rubber;
    cm("anomaly.clinic.torso", 0.2, 0.62, 0.32, -2.72, 0.78, 37, fm);
    cm("anomaly.clinic.shoulders", 0.22, 0.11, 0.42, -2.72, 1.06, 37, fm);
    cm("anomaly.clinic.thighs", 0.5, 0.14, 0.2, -2.95, 0.5, 37, fm);
    cm("anomaly.clinic.shins", 0.12, 0.45, 0.18, -3.1, 0.22, 37, fm);
    cm("anomaly.clinic.arm.0", 0.34, 0.09, 0.1, -2.85, 0.86, 36.83, fm);
    cm("anomaly.clinic.arm.1", 0.34, 0.09, 0.1, -2.85, 0.86, 37.17, fm);
    const cskull = CreateSphere("anomaly.clinic.head", { diameter: 0.19, segments: 10 }, scene);
    cskull.material = fm;
    cskull.scaling = new Vector3(0.95, 1.35, 1);
    cskull.position = new Vector3(-2.72, 1.26, 37);
    cskull.parent = clinicRoom;
  }
  clinicRoom.setEnabled(false);
  const clinicLamp = new PointLight("anomaly.clinic.lamp", new Vector3(-2.15, 1.95, 37.2), scene);
  clinicLamp.diffuse = new Color3(0.95, 0.9, 0.72);
  clinicLamp.intensity = 0.0;
  clinicLamp.range = 3.4;
  zones.find((z) => z.name === "clinic")?.extraLights.push(clinicLamp);

  // ─── service.stairwell — a lit stair throat behind the z≈15.5 service
  // door that cannot exist behind a 0.12 m wall. Prebuilt disabled like
  // depthRoom/clinicAlcove; the anomaly shows it with the leaf swung in.
  const serviceStair = new TransformNode("anomaly.stair.room", scene);
  serviceStair.parent = root;
  {
    const sm = (
      name: string,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: Material = mats.concrete,
    ) => {
      const b = kit.box(name, w, h, d, mat, scene, serviceStair);
      b.position = new Vector3(x, y, z);
      return b;
    };
    // warm incandescent — the stairwell does not run on corridor current
    const stairBulbMat = new StandardMaterial("mat.stairbulb", scene);
    stairBulbMat.diffuseColor = new Color3(0.35, 0.26, 0.14);
    stairBulbMat.emissiveColor = new Color3(0.85, 0.6, 0.28);
    const stairSlitMat = new StandardMaterial("mat.stairslit", scene);
    stairSlitMat.diffuseColor = new Color3(0.4, 0.24, 0.08);
    stairSlitMat.emissiveColor = new Color3(1.0, 0.62, 0.22);
    // landing at corridor floor level, then a straight flight down (+x)
    sm("anomaly.stair.landing", 0.9, 0.1, 1.3, 2.24, -0.05, 15.5);
    for (let i = 0; i < 9; i++) {
      sm(`anomaly.stair.step.${i}`, 0.26, 0.3, 1.2, 2.75 + i * 0.24, -(i + 1) * 0.185 - 0.15, 15.5);
    }
    sm("anomaly.stair.bottom", 0.7, 0.1, 1.3, 5.0, -1.72, 15.5);
    // end wall + the far door with light living under it — it continues
    sm("anomaly.stair.endwall", 0.12, 4.6, 1.5, 5.35, 0.42, 15.5);
    sm("anomaly.stair.fardoor", 0.08, 1.9, 0.72, 5.27, -0.73, 15.5, mats.rubber);
    sm("anomaly.stair.farslit", 0.03, 0.05, 0.6, 5.21, -1.66, 15.5, stairSlitMat);
    // side walls close the throat; heights reach the landing ceiling
    sm("anomaly.stair.wall.0", 3.7, 4.7, 0.12, 3.6, 0.48, 14.85);
    sm("anomaly.stair.wall.1", 3.7, 4.7, 0.12, 3.6, 0.48, 16.15);
    sm("anomaly.stair.above", 0.1, 0.6, 1.3, 1.95, 2.4, 15.5);
    sm("anomaly.stair.ceil", 0.95, 0.08, 1.3, 2.24, 2.66, 15.5);
    const soffit = sm("anomaly.stair.soffit", 2.75, 0.08, 1.3, 3.75, 1.82, 15.5);
    soffit.rotation.z = -0.658;
    // reveal liners filling the cut wall's raw edges
    sm("anomaly.stair.reveal.0", 0.24, 2.2, 0.06, 1.86, 1.1, 15.01);
    sm("anomaly.stair.reveal.1", 0.24, 2.2, 0.06, 1.86, 1.1, 15.99);
    // handrail riding the flight on the south wall
    const rail = sm("anomaly.stair.rail", 2.3, 0.05, 0.05, 3.62, 0.1, 16.05, mats.steel);
    rail.rotation.z = -0.658;
    sm("anomaly.stair.railpost.0", 0.04, 0.9, 0.04, 2.95, -0.12, 16.05, mats.steel);
    sm("anomaly.stair.railpost.1", 0.04, 0.9, 0.04, 4.25, -1.12, 16.05, mats.steel);
    // the hanging bulb over the landing — pull cord and all
    sm("anomaly.stair.cage", 0.14, 0.05, 0.14, 2.24, 2.56, 15.5, mats.steel);
    sm("anomaly.stair.cord", 0.015, 0.22, 0.015, 2.24, 2.42, 15.5, mats.steel);
    sm("anomaly.stair.bulb", 0.075, 0.1, 0.075, 2.24, 2.46, 15.5, stairBulbMat);
  }
  serviceStair.setEnabled(false);
  const serviceStairLamp = new PointLight("anomaly.stair.lamp", new Vector3(2.2, 2.25, 15.5), scene);
  serviceStairLamp.diffuse = new Color3(1.0, 0.72, 0.38);
  serviceStairLamp.intensity = 0.0;
  serviceStairLamp.range = 3.6;

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
    clinicAlcove: clinicRoom,
    clinicLamp,
    serviceStair,
    serviceStairLamp,
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
