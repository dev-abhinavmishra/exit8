/**
 * Baseline fixtures — the corridor furniture that makes the space read as
 * a working institution rather than a rendering of one: a fire point, a
 * waiting bench, a service bin. Fixed every loop (they are anchors, so a
 * fixture anomaly can later move/remove them), never registered with the
 * scatter pool.
 */
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import { makeRotaBoard, makeRouteMap } from "./textures";
import type { MaterialSet } from "../materials/library";
import type { WorldRegistry } from "../registry";
import * as kit from "./kit";

/** wall inner face (wall boxes are 0.12 thick at |x|=1.8) */
const WALL_X = 1.74;

export function buildFixtures(
  scene: Scene,
  root: TransformNode,
  mats: MaterialSet,
  registry: WorldRegistry,
): void {
  // ---- fire point dressing: the existing fireCabinet (right z≈18)
  //      gains its dark-glass window + FIRE POINT label so it reads
  //      as the institutional fitting it's meant to be ----
  const cab = registry.mesh("fireCabinet");
  // glass door is a child of the cabinet — prop.displaced mirrors the
  // whole unit (cabinet, window, and contents) to the opposite wall.
  // TRAP: contents inside the solid cab box are occluded by its own
  // front face forever — the window showed solid red. So the glass
  // stands PROUD of the face with a steel bezel, and the contents
  // live in the gap between face and glass.
  const fireGlass = new StandardMaterial("mat.fireGlass", scene);
  fireGlass.diffuseColor = new Color3(0.1, 0.11, 0.13);
  fireGlass.specularColor = new Color3(0.4, 0.4, 0.4);
  fireGlass.alpha = 0.22;
  fireGlass.backFaceCulling = false;
  const glass = kit.plane("fire.point.glass", 0.36, 0.5, fireGlass, scene);
  glass.parent = cab;
  glass.position = new Vector3(-0.135, 0, 0);
  glass.rotation.y = Math.PI / 2;
  registry.register("fire.point.glass", glass);
  // bezel frame around the glass door — top/bottom/left/right strips
  for (const [bx, by, bz, bw, bh] of [
    [-0.138, 0.26, 0, 0.4, 0.025],
    [-0.138, -0.26, 0, 0.4, 0.025],
    [-0.138, 0, 0.19, 0.025, 0.52],
    [-0.138, 0, -0.19, 0.025, 0.52],
  ] as const) {
    const strip = kit.box(`fire.cab.bezel.${by}.${bz}`, bw, bh, 0.03, mats.steel, scene);
    strip.parent = cab;
    strip.position = new Vector3(bx, by, bz);
  }
  // pull handle on the door's hinge edge
  const pull = kit.box("fire.cab.pull", 0.02, 0.14, 0.02, mats.steel, scene);
  pull.parent = cab;
  pull.position = new Vector3(-0.148, 0, -0.16);
  // hose reel + valve wheel + nozzle behind the glass — self-illuminated
  // so the silhouettes read through the smoke without a lit interior
  const drumMat = new StandardMaterial("mat.fireCabDrum", scene);
  drumMat.disableLighting = true;
  drumMat.emissiveColor = new Color3(0.58, 0.13, 0.09);
  const reel = CreateCylinder("fire.cab.reel", { height: 0.03, diameter: 0.28, tessellation: 16 }, scene);
  reel.material = drumMat;
  reel.parent = cab;
  reel.rotation.z = Math.PI / 2;
  reel.position = new Vector3(-0.107, 0.06, -0.02);
  const reelHub = CreateCylinder("fire.cab.hub", { height: 0.02, diameter: 0.09, tessellation: 12 }, scene);
  reelHub.material = mats.steel;
  reelHub.parent = cab;
  reelHub.rotation.z = Math.PI / 2;
  reelHub.position = new Vector3(-0.118, 0.06, -0.02);
  const valve = CreateCylinder("fire.cab.valve", { height: 0.02, diameter: 0.09, tessellation: 12 }, scene);
  valve.material = mats.steel;
  valve.parent = cab;
  valve.rotation.z = Math.PI / 2;
  valve.position = new Vector3(-0.107, -0.19, 0.09);
  const nozzle = kit.box("fire.cab.nozzle", 0.05, 0.14, 0.05, mats.rubber, scene);
  nozzle.parent = cab;
  nozzle.position = new Vector3(-0.105, -0.17, -0.11);
  const label = kit.wallSign("sign.fire.point", mats, scene, root, registry, 0.5, 0.16);
  label.position = new Vector3(WALL_X - 0.06, 1.95, 18);
  label.rotation.y = Math.PI / 2;

  // ---- a second bench mid-corridor opposite the records wall, z≈33 ----
  const bench2 = kit.bench(mats, scene, root, registry, "bench.south");
  bench2.position = new Vector3(-WALL_X + 0.45, 0, 33.3);

  // ---- service bin near the south end, right wall z≈51.5 ----
  const bin = kit.box("bin", 0.34, 0.6, 0.34, mats.rubber, scene, root);
  bin.position = new Vector3(WALL_X - 0.24, 0.3, 51.5);
  registry.register("bin", bin);
  // rim lip + dark liner mouth + a steel band — children so bin.*
  // anomalies carry them
  const binRim = kit.box("bin.rim", 0.38, 0.05, 0.38, mats.steel, scene);
  binRim.parent = bin;
  binRim.position = new Vector3(0, 0.28, 0);
  const binLiner = kit.box("bin.liner", 0.3, 0.04, 0.3, mats.rubber, scene);
  binLiner.parent = bin;
  binLiner.position = new Vector3(0, 0.265, 0);
  const binBand = kit.box("bin.band", 0.345, 0.07, 0.345, mats.steel, scene);
  binBand.parent = bin;
  binBand.position = new Vector3(0, -0.12, 0);

  // ---- fire hose reel cabinet, left wall z≈44.6 — red accent in the
  //      dark stretch before the service junction ----
  const hoseCab = kit.box("dress.hose.cab", 0.12, 0.6, 0.5, mats.cabinetRed, scene, root);
  hoseCab.position = new Vector3(-WALL_X + 0.07, 1.35, 44.6);
  const hoseReel = CreateCylinder(
    "dress.hose.reel",
    { height: 0.05, diameter: 0.34, tessellation: 20 },
    scene,
  );
  hoseReel.material = mats.cabinetRed;
  hoseReel.parent = root;
  hoseReel.position = new Vector3(-WALL_X + 0.14, 1.38, 44.6);
  hoseReel.rotation.z = Math.PI / 2;
  const hoseHub = CreateCylinder("dress.hose.hub", { height: 0.06, diameter: 0.08, tessellation: 12 }, scene);
  hoseHub.material = mats.steel;
  hoseHub.parent = root;
  hoseHub.position = new Vector3(-WALL_X + 0.155, 1.38, 44.6);
  hoseHub.rotation.z = Math.PI / 2;
  const hoseNoz = kit.box("dress.hose.nozzle", 0.04, 0.16, 0.04, mats.steel, scene, root);
  hoseNoz.position = new Vector3(-WALL_X + 0.14, 1.14, 44.75);

  // ---- janitorial bucket + mop, west wall z≈42.2 — yellow bucket
  //      against the wall, mop leaning. Registered node (not merged):
  //      bucket.tipped spills it ----
  const mopYellow = new StandardMaterial("mat.mop.yellow", scene);
  mopYellow.diffuseColor = new Color3(0.55, 0.42, 0.05);
  mopYellow.emissiveColor = new Color3(0.02, 0.015, 0.002);
  mopYellow.specularColor = new Color3(0.08, 0.08, 0.08);
  const mopSet = new TransformNode("mop.bucket", scene);
  mopSet.parent = root;
  mopSet.position = new Vector3(-WALL_X + 0.3, 0, 42.2);
  registry.register("mop.bucket", mopSet);
  const bucket = CreateCylinder(
    "mop.bucket.body",
    { height: 0.26, diameterTop: 0.24, diameterBottom: 0.19, tessellation: 16 },
    scene,
  );
  bucket.material = mopYellow;
  bucket.parent = mopSet;
  bucket.position = new Vector3(0, 0.13, 0);
  const wringer = kit.box("mop.bucket.wringer", 0.16, 0.14, 0.18, mats.rubber, scene);
  wringer.parent = mopSet;
  wringer.position = new Vector3(-0.04, 0.3, 0);
  const mop = CreateCylinder("mop.bucket.mop", { height: 1.35, diameter: 0.025, tessellation: 8 }, scene);
  mop.material = mats.wallPanel;
  mop.parent = mopSet;
  mop.position = new Vector3(-0.18, 0.65, 0.12);
  mop.rotation.z = 0.12;
  const mopHead = kit.box("mop.bucket.mophead", 0.06, 0.14, 0.06, mats.rubber, scene);
  mopHead.parent = mopSet;
  mopHead.position = new Vector3(-0.11, 0.07, 0.12);

  // ---- heating convector, east wall z≈10.5 — long finned radiator
  //      panel between the wayfinding posters and the fire point.
  //      Registered node (not merged): rad.leaks pools water under it ----
  const radSet = new TransformNode("rad.unit", scene);
  radSet.parent = root;
  radSet.position = new Vector3(WALL_X - 0.12, 0, 10.5);
  registry.register("rad.unit", radSet);
  const radBody = kit.box("rad.body", 0.1, 0.5, 1.8, mats.wallPanel, scene);
  radBody.parent = radSet;
  radBody.position = new Vector3(0, 0.42, 0);
  for (let i = 0; i < 11; i++) {
    const fin = kit.box(`rad.fin.${i}`, 0.014, 0.4, 0.06, mats.wallPanel, scene);
    fin.parent = radSet;
    fin.position = new Vector3(-0.062, 0.42, -0.75 + i * 0.15);
  }
  const radTop = kit.box("rad.top", 0.12, 0.03, 1.82, mats.wallPanel, scene);
  radTop.parent = radSet;
  radTop.position = new Vector3(0, 0.68, 0);
  for (const fz of [-0.7, 0.7]) {
    const foot = kit.box(`rad.foot.${fz}`, 0.16, 0.1, 0.08, mats.wallPanel, scene);
    foot.parent = radSet;
    foot.position = new Vector3(0.01, 0.05, fz);
  }
  const radValve = CreateCylinder("rad.valve", { height: 0.08, diameter: 0.05, tessellation: 10 }, scene);
  radValve.material = mats.steel;
  radValve.parent = radSet;
  radValve.position = new Vector3(0, 0.28, 0.94);
  const radKnob = CreateCylinder(
    "rad.knob",
    { height: 0.05, diameterTop: 0.07, diameterBottom: 0.04, tessellation: 10 },
    scene,
  );
  radKnob.material = mats.rubber;
  radKnob.parent = radSet;
  radKnob.position = new Vector3(0, 0.36, 0.94);
  const radPipe = CreateCylinder("rad.pipe", { height: 0.24, diameter: 0.03, tessellation: 8 }, scene);
  radPipe.material = mats.steel;
  radPipe.parent = radSet;
  radPipe.position = new Vector3(0, 0.12, 0.94);

  // ---- staff lockers, west wall z≈48 — a run of four narrow lockers
  //      filling the dark stretch before the south airlock.
  //      Registered node (not merged): locker.ajar swings a door ----
  const lockers = new TransformNode("lockers", scene);
  lockers.parent = root;
  lockers.position = new Vector3(-WALL_X + 0.15, 0, 51.0); // south of the S-2 bay mouth — still a corridor landmark
  registry.register("lockers", lockers);
  const lockerCar = kit.box("lockers.carcase", 0.28, 1.9, 1.84, mats.wallPanel, scene);
  lockerCar.parent = lockers;
  lockerCar.position = new Vector3(-0.05, 0.95, 0);
  const lockerKick = kit.box("lockers.kick", 0.26, 0.08, 1.8, mats.rubber, scene);
  lockerKick.parent = lockers;
  lockerKick.position = new Vector3(-0.05, 0.04, 0);
  const lockerTop = kit.box("lockers.top", 0.3, 0.04, 1.86, mats.wallPanel, scene);
  lockerTop.parent = lockers;
  lockerTop.position = new Vector3(-0.05, 1.92, 0);
  for (let i = 0; i < 4; i++) {
    const dz = -0.675 + i * 0.45;
    // every door hangs on a registered hinge pivot — locker.ajar swings
    // door 2, lockers.all swings the whole run
    const pivot = new TransformNode(`lockers.door${i}.pivot`, scene);
    pivot.parent = lockers;
    pivot.position = new Vector3(0.09, 0.95, dz - 0.21);
    registry.register(`lockers.door${i}.pivot`, pivot);
    const leaf = kit.box(`lockers.door.${i}`, 0.012, 1.7, 0.42, mats.wallPanel, scene);
    leaf.parent = pivot;
    leaf.position = new Vector3(0, 0, 0.21);
    const vent = kit.box(`lockers.door.${i}.vent`, 0.008, 0.16, 0.3, mats.rubber, scene);
    vent.parent = leaf;
    vent.position = new Vector3(0.009, 0.55, 0);
    const hnd = kit.box(`lockers.door.${i}.hnd`, 0.02, 0.1, 0.03, mats.steel, scene);
    hnd.parent = leaf;
    hnd.position = new Vector3(0.016, -0.1, 0.16);
  }

  // ---- first aid cabinet, east wall z≈46 — white surface-mount box,
  //      green cross; fills the bare span between vending and the
  //      lift lobby. Registered node (not merged): aid.gone removes it ----
  const aidWhite = new StandardMaterial("mat.firstaid.white", scene);
  aidWhite.diffuseColor = new Color3(0.4, 0.41, 0.39);
  aidWhite.emissiveColor = new Color3(0.008, 0.008, 0.008);
  aidWhite.specularColor = new Color3(0.04, 0.04, 0.04);
  const aidGreen = new StandardMaterial("mat.firstaid.cross", scene);
  aidGreen.diffuseColor = new Color3(0.03, 0.24, 0.12);
  aidGreen.emissiveColor = new Color3(0.005, 0.02, 0.008);
  aidGreen.specularColor = new Color3(0.03, 0.03, 0.03);
  const aid = new TransformNode("aid.cabinet", scene);
  aid.parent = root;
  aid.position = new Vector3(WALL_X - 0.045, 1.5, 46);
  registry.register("aid.cabinet", aid);
  const aidCab = kit.box("aid.cabinet.body", 0.06, 0.4, 0.3, aidWhite, scene);
  aidCab.parent = aid;
  const aidH = kit.box("aid.cabinet.cross.h", 0.014, 0.045, 0.15, aidGreen, scene);
  aidH.parent = aid;
  aidH.position = new Vector3(-0.033, 0, 0);
  const aidV = kit.box("aid.cabinet.cross.v", 0.014, 0.15, 0.045, aidGreen, scene);
  aidV.parent = aid;
  aidV.position = new Vector3(-0.033, 0, 0);
  const aidLatch = kit.box("aid.cabinet.latch", 0.016, 0.05, 0.02, mats.rubber, scene);
  aidLatch.parent = aid;
  aidLatch.position = new Vector3(-0.035, -0.08, 0.12);

  // ---- breaker panel, west wall z≈38 — grey flush-mount cabinet with a
  //      hinged door leaf over dark breaker rows; fills the bare span
  //      between the second bench and the hose reel. Registered nodes
  //      (not merged): panel.open swings the door ----
  const elecPaint = new StandardMaterial("mat.elec.paint", scene);
  elecPaint.diffuseColor = new Color3(0.16, 0.17, 0.16);
  elecPaint.emissiveColor = new Color3(0.004, 0.004, 0.004);
  elecPaint.disableLighting = true; // matte powder-coat — specular wash read as blown pale
  const elecDark = new StandardMaterial("mat.elec.dark", scene);
  elecDark.diffuseColor = new Color3(0.03, 0.03, 0.035);
  elecDark.specularColor = new Color3(0, 0, 0);
  elecDark.disableLighting = true; // the interior reads "dark bus" only if it stays black
  const elec = new TransformNode("elec.panel", scene);
  elec.parent = root;
  elec.position = new Vector3(-WALL_X + 0.04, 1.5, 38);
  registry.register("elec.panel", elec);
  const elecBody = kit.box("elec.panel.body", 0.05, 0.62, 0.42, elecPaint, scene);
  elecBody.parent = elec;
  // dark bus interior with three breaker rows behind the door
  const elecBus = kit.box("elec.panel.bus", 0.012, 0.5, 0.3, elecDark, scene);
  elecBus.parent = elec;
  elecBus.position = new Vector3(0.012, 0, 0);
  for (const i of [0, 1, 2]) {
    const brk = kit.box(`elec.panel.brk.${i}`, 0.014, 0.05, 0.22, mats.wallPanel, scene);
    brk.parent = elec;
    brk.position = new Vector3(0.019, 0.16 - i * 0.16, 0);
  }
  // door leaf hinged at the south edge; +rotation.y swings it into the corridor
  const doorPivot = new TransformNode("elec.panel.door", scene);
  doorPivot.parent = elec;
  doorPivot.position = new Vector3(0.032, 0, -0.2);
  registry.register("elec.panel.door", doorPivot);
  const elecDoor = kit.box("elec.panel.leaf", 0.012, 0.58, 0.4, elecPaint, scene);
  elecDoor.parent = doorPivot;
  elecDoor.position = new Vector3(0, 0, 0.2);
  const elecWarn = kit.box("elec.panel.warn", 0.008, 0.1, 0.14, mats.guideStrip, scene);
  elecWarn.parent = elecDoor;
  elecWarn.position = new Vector3(0.006, 0.1, -0.05);
  const elecLamp = kit.box("elec.panel.lamp", 0.012, 0.02, 0.03, mats.trofferDim, scene);
  elecLamp.parent = elecDoor;
  elecLamp.position = new Vector3(0.006, -0.22, -0.05);
  const elecConduit = kit.box("elec.panel.conduit", 0.03, 1.1, 0.03, mats.rubber, scene);
  elecConduit.parent = elec;
  elecConduit.position = new Vector3(-0.02, -0.85, 0);

  // ---- low service pipe run, west wall z 32.6–44 — twin lines hugging
  //      the wall at hand height, broken around the breaker panel like a
  //      real retrofit. The bare field between the records bank and the
  //      hose reel reads as corridor infrastructure. Merged dressing ----
  const pipeMat = new StandardMaterial("mat.pipe.gray", scene);
  pipeMat.diffuseColor = new Color3(0.3, 0.3, 0.29);
  pipeMat.disableLighting = true; // painted conduit — flat gray reads in every zone
  for (const [i, [z0, z1]] of [
    [0, [32.6, 37.7]],
    [1, [38.35, 44]],
  ] as const) {
    for (const [j, py] of [
      [0, 1.02],
      [1, 1.16],
    ] as const) {
      const pipe = kit.box(`dress.wpipes.${i}.${j}`, 0.05, 0.045, z1 - z0, pipeMat, scene, root);
      pipe.position = new Vector3(-WALL_X + 0.085, py, (z0 + z1) / 2);
    }
  }
  for (let z = 33.4; z <= 43.9; z += 2.6) {
    if (z > 37.4 && z < 38.6) continue;
    const strap = kit.box(`dress.wpipes.h.${z.toFixed(1)}`, 0.1, 0.34, 0.045, pipeMat, scene, root);
    strap.position = new Vector3(-WALL_X + 0.05, 1.09, z);
  }
  // one isolation valve tapping the upper run
  const vstem = kit.box("dress.wpipes.valve.stem", 0.05, 0.1, 0.05, pipeMat, scene, root);
  vstem.position = new Vector3(-WALL_X + 0.085, 1.21, 36.8);
  const vwheel = CreateCylinder(
    "dress.wpipes.valve.wheel",
    { height: 0.016, diameter: 0.12, tessellation: 16 },
    scene,
  );
  vwheel.material = mats.cabinetRed;
  vwheel.parent = root;
  vwheel.position = new Vector3(-WALL_X + 0.12, 1.28, 36.8);
  vwheel.rotation.z = Math.PI / 2;

  buildImpossibleFacade(scene, root, mats, registry);
  buildLiftLobby(scene, root, mats, registry);
  buildGuideStrip(scene, root, mats, registry);
  buildDressing(scene, root, mats, registry);
}

/** Second-pass dressing — the small fixed details that turn geometry
 * into a place: records bay plates, a shut service hatch, worn floor
 * wayfinding, ceiling vent grilles, conduit risers. All static, all
 * part of the baseline a player memorizes. */
function buildDressing(scene: Scene, root: TransformNode, mats: MaterialSet, registry: WorldRegistry): void {
  // ---- records bay plates: steel label frames with pale slips, six
  //      bays down the cabinet bank ----
  const CABINET_FACE = -1.55;
  for (const z of [15.5, 18.5, 21.5, 24.5, 27.5, 30.5]) {
    const plate = kit.box(`bay.plate.${z}`, 0.02, 0.1, 0.16, mats.steel, scene, root);
    plate.position = new Vector3(CABINET_FACE + 0.02, 1.92, z);
    const slip = kit.box(
      `bay.plate.${z}.slip`,
      0.012,
      0.06,
      0.12,
      mats.sign.get("sign.notice.board") ?? mats.steel,
      scene,
      root,
    );
    slip.position = new Vector3(CABINET_FACE + 0.032, 1.92, z);
    registry.register(`bay.plate.${z}`, plate);
  }

  // ---- the service hatch that is always shut (east wall, z=40) ----
  const hatch = kit.box("hatch.plate", 0.05, 0.95, 0.65, mats.steel, scene, root);
  hatch.position = new Vector3(WALL_X - 0.02, 1.3, 40);
  registry.register("hatch.plate", hatch);
  // its hinge screws + recessed pull so it reads as a hatch, not a panel
  const pull = kit.box("hatch.plate.pull", 0.03, 0.12, 0.05, mats.rubber, scene, root);
  pull.position = new Vector3(WALL_X - 0.05, 1.3, 40.22);

  // ---- LOOP 7 route map — a framed schematic panel on the east wall,
  //      the corridor's memorization anchor ----
  const mapTex = makeRouteMap(scene);
  const mapMat = new StandardMaterial("mat.routemap", scene);
  mapMat.diffuseTexture = mapTex;
  mapMat.specularColor = Color3.Black();
  mapMat.emissiveColor = new Color3(0.09, 0.09, 0.08);
  const mapFrame = kit.box("dress.routemap.frame", 0.04, 0.56, 0.76, mats.steel, scene, root);
  mapFrame.position = new Vector3(WALL_X - 0.03, 1.62, 32.9); // arc18: cage took z33.8+
  const mapFace = kit.plane("map.routemap", 0.7, 0.5, mapMat, scene, root);
  mapFace.position = new Vector3(WALL_X - 0.052, 1.62, 32.9);
  mapFace.rotation.y = Math.PI / 2;
  // NOT dress.* — anomalies repaint this face (map.wrong); a dress.*
  // name would fold it into the static merge and lose its texture
  registry.register("map.routemap", mapFace);

  // ---- night staffing rota — framed duty board on the west wall at
  //      the intake end, opposite the NORTH INTAKE sign ----
  const rotaTex = makeRotaBoard(scene);
  const rotaMat = new StandardMaterial("mat.rota", scene);
  rotaMat.diffuseTexture = rotaTex;
  rotaMat.specularColor = Color3.Black();
  rotaMat.emissiveColor = new Color3(0.09, 0.09, 0.08);
  const rotaFrame = kit.box("dress.rota.frame", 0.04, 0.62, 0.82, mats.steel, scene, root);
  rotaFrame.position = new Vector3(-WALL_X + 0.03, 1.6, 2.4);
  const rotaFace = kit.plane("rota.face", 0.76, 0.56, rotaMat, scene, root);
  rotaFace.position = new Vector3(-WALL_X + 0.052, 1.6, 2.4);
  rotaFace.rotation.y = -Math.PI / 2;
  // NOT dress.* — anomalies repaint this face (rota.stamped); a dress.*
  // name would fold it into the static merge and lose its texture
  registry.register("rota.face", rotaFace);

  // ---- worn floor wayfinding: a painted route arrow, faded into the
  //      terrazzo at approach points ----
  const arrowTex = new DynamicTexture("tex.floorArrow", { width: 256, height: 512 }, scene, true);
  arrowTex.hasAlpha = true;
  {
    const c = arrowTex.getContext() as unknown as CanvasRenderingContext2D;
    c.scale(2, 2);
    c.clearRect(0, 0, 128, 256);
    c.fillStyle = "rgba(214,206,186,0.5)";
    c.font = "bold 110px Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("7", 64, 105);
    c.fillRect(52, 128, 24, 80);
    c.beginPath();
    c.moveTo(64, 236);
    c.lineTo(30, 200);
    c.lineTo(98, 200);
    c.closePath();
    c.fill();
    // wear: erase streaks so the paint reads ground-in
    c.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 120; i++) {
      const y = Math.floor(Math.abs(Math.sin(i * 12.9898)) * 43758.5453) % 256;
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(0, y, 128, 2);
    }
    arrowTex.update();
  }
  const arrowMat = new StandardMaterial("mat.floorArrow", scene);
  arrowMat.diffuseTexture = arrowTex;
  arrowMat.opacityTexture = arrowTex;
  arrowMat.disableLighting = true;
  arrowMat.backFaceCulling = false;
  for (const [x, z] of [
    [-0.35, 10],
    [0.3, 30],
    [0.05, 48],
  ]) {
    const decal = CreatePlane(`floor.arrow.${z}`, { width: 0.5, height: 1.0 }, scene);
    decal.material = arrowMat;
    decal.position = new Vector3(x, 0.012, z);
    decal.rotation.x = -Math.PI / 2; // face up; canvas-bottom = +z (south)
    decal.parent = root;
    registry.register(`floor.arrow.${z}`, decal);
  }
  // the same routing mark, stencil-painted on the wall — dark cut-paint
  // like a real sprayed stencil, aimed down-route (+z south)
  const stencilTex = new DynamicTexture("tex.wallStencil", { width: 512, height: 256 }, scene, true);
  stencilTex.hasAlpha = true;
  {
    const c = stencilTex.getContext() as unknown as CanvasRenderingContext2D;
    c.scale(2, 2);
    c.clearRect(0, 0, 256, 128);
    c.fillStyle = "rgba(60,56,50,0.62)";
    c.font = "bold 56px Arial, sans-serif";
    c.textAlign = "center";
    c.fillText("7", 30, 78);
    c.fillRect(64, 58, 120, 20);
    c.beginPath();
    c.moveTo(236, 68);
    c.lineTo(186, 34);
    c.lineTo(186, 102);
    c.closePath();
    c.fill();
    // stencil bridges: gaps across the shaft where the cut mask held
    c.globalCompositeOperation = "destination-out";
    c.fillRect(120, 50, 8, 36);
    c.fillRect(148, 50, 8, 36);
    // wear streaks
    for (let i = 0; i < 60; i++) {
      const y = Math.floor(Math.abs(Math.sin(i * 12.9898)) * 43758.5453) % 128;
      c.fillRect(0, y, 256, 1.5);
    }
    stencilTex.update();
  }
  const stencilMat = new StandardMaterial("mat.wallStencil", scene);
  stencilMat.diffuseTexture = stencilTex;
  stencilMat.opacityTexture = stencilTex;
  stencilMat.disableLighting = true;
  stencilMat.backFaceCulling = false;
  for (const [sx, sz] of [
    [-1, 10.7],
    [1, 33.4],
    [-1, 48.7],
  ] as const) {
    const st = kit.plane(`dress.stencil.${sz}`, 0.85, 0.42, stencilMat, scene, root);
    st.position = new Vector3(sx * 1.77, 1.35, sz);
    st.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    // canvas +x aims −z on the left wall; flip in-plane so it aims +z (south)
    if (sx < 0) st.rotation.z = Math.PI;
  }

  // ---- ceiling vent grilles: dark slatted panels between troffers ----
  for (const z of [8, 24, 44]) {
    const vent = kit.box(`ceiling.vent.${z}`, 0.6, 0.04, 0.9, mats.rubber, scene, root);
    vent.position = new Vector3(z === 24 ? -0.8 : 0.8, 2.97, z);
    registry.register(`ceiling.vent.${z}`, vent);
    for (let i = 0; i < 4; i++) {
      const slat = kit.box(`ceiling.vent.${z}.${i}`, 0.56, 0.05, 0.1, mats.steel, scene, root);
      slat.position = new Vector3(vent.position.x, 2.96, z - 0.3 + i * 0.2);
    }
  }

  // ---- conduit risers: thin vertical runs pinned to wall faces ----
  for (const [x, z] of [
    [-WALL_X + 0.03, 11],
    [WALL_X - 0.03, 21],
    [-WALL_X + 0.03, 36],
    [WALL_X - 0.03, 47],
  ]) {
    const pipe = kit.box(`conduit.${z}`, 0.07, 3.0, 0.07, mats.steel, scene, root);
    pipe.position = new Vector3(x, 1.5, z);
  }
}

/** Tactile guide strip: the raised amber channel that runs the corridor
 * right of centre — the line every inspector memorizes. Built in 8
 * registered segments so anomalies can break its continuity. */
function buildGuideStrip(
  scene: Scene,
  root: TransformNode,
  mats: MaterialSet,
  registry: WorldRegistry,
): void {
  const SEGMENTS = 8;
  const Z0 = 3.0;
  const Z1 = 54.2;
  const segLen = (Z1 - Z0) / SEGMENTS;
  for (let i = 0; i < SEGMENTS; i++) {
    const s = kit.box(`guide.seg.${i}`, 0.34, 0.014, segLen - 0.04, mats.guideStrip, scene, root);
    s.position = new Vector3(0.72, 0.008, Z0 + segLen * (i + 0.5));
    registry.register(`guide.seg.${i}`, s);
  }
}

/**
 * Sealed lift lobby on the east wall at z≈49.5 — split steel doors,
 * an OUT OF SERVICE plaque, a dead call panel. The junction fiction:
 * this corridor once fed a service lift; now the doors never open.
 */
function buildLiftLobby(scene: Scene, root: TransformNode, mats: MaterialSet, registry: WorldRegistry): void {
  const Z = 49.5;
  const node = new TransformNode("lift.lobby", scene);
  node.parent = root;
  node.position = new Vector3(0, 0, Z);
  registry.register("lift.lobby", node);

  // the shaft's back plate, deep inside the recess cut into the east
  // wall (dress.lobby.* shell in concourse.ts) — the leaves part onto
  // real throat depth under lift.arrives, not a flat plane
  const reveal = kit.box("lift.reveal", 0.06, 2.5, 1.64, mats.rubber, scene, node);
  reveal.position = new Vector3(WALL_X + 1.02, 1.25, 0);
  for (const sx of [-1, 1]) {
    // pale leaves inside the alcove's back wall — metals go near-black in
    // the junction's weak reflections; wall paneling reads as a door set
    const leaf = kit.box(`lift.door.${sx}`, 0.035, 2.3, 0.66, mats.wallPanel, scene, node);
    leaf.position = new Vector3(WALL_X + 0.5, 1.15, sx * 0.36);
    registry.register(`lift.door.${sx}`, leaf);
    // leaf collider parented to the leaf — rides the slide so parted
    // leaves leave a REAL gap (walk-through defect: closed doors were
    // visual-only and you could ghost into the sealed shaft)
    kit.collider(`lift.door.${sx}.col`, 0.05, 2.3, 0.66, new Vector3(0, 0, 0), scene, leaf);
    // dark hinge edge on the leaf's outer side — children ride lift.door
    const edge = kit.box(`lift.door.${sx}.edge`, 0.008, 2.3, 0.025, mats.rubber, scene);
    edge.parent = leaf;
    edge.position = new Vector3(0, 0, -sx * 0.32);
  }
  const lintel = kit.box("lift.lintel", 0.09, 0.3, 1.56, mats.steel, scene, node);
  lintel.position = new Vector3(WALL_X + 0.51, 2.48, 0);
  const sill = kit.box("lift.sill", 0.11, 0.04, 1.56, mats.steel, scene, node);
  sill.position = new Vector3(WALL_X + 0.5, 0.02, 0);

  // call panel: dead lamp + a single worn button on a beveled face —
  // on the alcove's back wall beside the doors
  const panel = kit.box("lift.panel", 0.05, 0.22, 0.12, mats.steel, scene, node);
  panel.position = new Vector3(WALL_X + 0.5, 1.35, 0.95);
  const lamp = kit.box("lift.panel.lamp", 0.03, 0.05, 0.05, mats.trofferDim, scene, node);
  lamp.position = new Vector3(WALL_X + 0.47, 1.42, 0.95);
  registry.register("lift.panel.lamp", lamp);
  registry.register("lift.panel", panel);
  // button + key slot — children of the panel, ride lift.* anomalies
  const btn = CreateCylinder("lift.panel.btn", { height: 0.02, diameter: 0.045, tessellation: 12 }, scene);
  btn.material = mats.rubber;
  btn.parent = panel;
  btn.rotation.z = Math.PI / 2;
  btn.position = new Vector3(-0.026, -0.03, 0);
  const btnRing = CreateCylinder(
    "lift.panel.ring",
    { height: 0.012, diameter: 0.06, tessellation: 12 },
    scene,
  );
  btnRing.material = mats.steel;
  btnRing.parent = panel;
  btnRing.rotation.z = Math.PI / 2;
  btnRing.position = new Vector3(-0.022, -0.03, 0);
  const keySlot = kit.box("lift.panel.key", 0.012, 0.05, 0.015, mats.rubber, scene);
  keySlot.parent = panel;
  keySlot.position = new Vector3(-0.026, 0.06, 0);

  // OUT OF SERVICE plaque above the doors
  const plaque = kit.wallSign("sign.lift", mats, scene, node, registry, 0.9, 0.3);
  plaque.position = new Vector3(WALL_X - 0.075, 2.78, 0);
  plaque.rotation.y = Math.PI / 2;
}

/**
 * A second airlock, walled across the corridor at z≈38 — prebuilt,
 * disabled. sightline.impossible enables it: the corridor ends where it
 * shouldn't, dead ahead, doors sealed. Collision rides under the same
 * node so the facade only blocks while it exists.
 */
function buildImpossibleFacade(
  scene: Scene,
  root: TransformNode,
  mats: MaterialSet,
  registry: WorldRegistry,
): void {
  const Z = 38;
  const H = 3.0;
  const DOOR_W = 2.4;
  const node = new TransformNode("sightline.facade", scene);
  node.parent = root;
  node.position = new Vector3(0, 0, Z);

  // wall across the full corridor width with a doorway gap in the middle
  const sideW = (WALL_X * 2 - DOOR_W) / 2;
  for (const sx of [-1, 1]) {
    const w = kit.box(`sightline.wall.${sx}`, sideW + 0.12, H, 0.14, mats.wallPanel, scene, node);
    w.position = new Vector3(sx * (DOOR_W / 2 + sideW / 2), H / 2, 0);
  }
  const lintel = kit.box("sightline.lintel", DOOR_W + 0.2, H - 2.65, 0.14, mats.steel, scene, node);
  lintel.position = new Vector3(0, 2.65 + (H - 2.65) / 2, 0);

  // sealed sliding doors — the south-pointing airlock face
  const d = kit.slidingDoor("sightline.door", DOOR_W, 2.65, mats, scene, node, registry);
  void d;
  // the exit-south sign art, reused — kit.wallSign would register
  // sign.sign.exit.south a second time, so the plane goes unregistered
  const signMat = mats.sign.get("sign.exit.south");
  if (signMat) {
    const above = kit.plane("sightline.sign", 1.3, 0.4, signMat, scene, node);
    above.position = new Vector3(0, H - 0.55, -0.08);
    above.rotation.y = 0;
  }

  // solid only while the facade exists
  kit.collider("sightline.col", WALL_X * 2, H, 0.16, new Vector3(0, H / 2, 0), scene, node);

  registry.register("sightline.facade", node);
  node.setEnabled(false);
}
