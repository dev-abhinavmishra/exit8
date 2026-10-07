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
import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { WorldRegistry } from "../registry";
import { buildMaterials, type MaterialSet } from "../materials/library";
import { buildTextureSet, type TextureSet } from "./textures";
import { RngStream } from "../../game/state/rng";
import { SIGNS } from "../../data/signage";
import * as kit from "./kit";
import { buildScatter, type ScatterPool } from "./scatter";

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
  colliders.push(kit.collider(`al.${side}.capCol`, w, h, 0.12, cap.position.clone(), scene, al));

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
  above.rotation.y = side === "north" ? 0 : Math.PI;

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
    zones.push({ name: zd.name, point, troffers, baseDiffuse: point.diffuse.clone() });
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

  // fire cabinet RIGHT z≈18
  const cabFire = kit.fireCabinet(mats, scene, root, registry);
  cabFire.position = new Vector3(C.xHalf - 0.12, 1.4, 18);

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
  sGallery.rotation.y = -Math.PI / 2;
  const sClinic = kit.wallSign("sign.clinic", mats, scene, root, registry, 1.5, 0.45);
  sClinic.position = new Vector3(-C.xHalf + 0.08, 2.5, 37);
  sClinic.rotation.y = Math.PI / 2;
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
    const dustAnchor = new TransformNode("fx.dust.anchor", scene);
    dustAnchor.parent = root;
    dust.emitter = dustAnchor;
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

  const scatter = buildScatter(scene, root, mats, runSeed);

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
    condensationPatch: condensation,
    scatter,
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
