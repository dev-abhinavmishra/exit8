/**
 * Baseline fixtures — the corridor furniture that makes the space read as
 * a working institution rather than a rendering of one: a fire point, a
 * waiting bench, a service bin. Fixed every loop (they are anchors, so a
 * fixture anomaly can later move/remove them), never registered with the
 * scatter pool.
 */
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
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
  const glass = kit.plane("fire.point.glass", 0.36, 0.5, mats.darkGlass, scene, root);
  glass.position = new Vector3(WALL_X - 0.11, 1.4, 18);
  glass.rotation.y = Math.PI / 2;
  registry.register("fire.point.glass", glass);
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

  buildImpossibleFacade(scene, root, mats, registry);
  buildLiftLobby(scene, root, mats, registry);
  buildGuideStrip(scene, root, mats, registry);
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

  // recessed dark shaft reveal BEHIND the door leaves, leaves proud in
  // front — the seam between them is the only darkness a lift has
  const reveal = kit.box("lift.reveal", 0.04, 2.4, 1.5, mats.rubber, scene, node);
  reveal.position = new Vector3(WALL_X - 0.01, 1.2, 0);
  for (const sx of [-1, 1]) {
    // pale leaves inside the dark shaft reveal — metals go near-black in
    // the junction's weak reflections; wall paneling reads as a door set
    const leaf = kit.box(`lift.door.${sx}`, 0.035, 2.3, 0.66, mats.wallPanel, scene, node);
    leaf.position = new Vector3(WALL_X - 0.05, 1.15, sx * 0.36);
    registry.register(`lift.door.${sx}`, leaf);
  }
  const lintel = kit.box("lift.lintel", 0.09, 0.3, 1.56, mats.steel, scene, node);
  lintel.position = new Vector3(WALL_X - 0.04, 2.48, 0);
  const sill = kit.box("lift.sill", 0.11, 0.04, 1.56, mats.steel, scene, node);
  sill.position = new Vector3(WALL_X - 0.055, 0.02, 0);

  // call panel: dead lamp + button
  const panel = kit.box("lift.panel", 0.05, 0.22, 0.12, mats.steel, scene, node);
  panel.position = new Vector3(WALL_X - 0.05, 1.35, 0.95);
  const lamp = kit.box("lift.panel.lamp", 0.03, 0.05, 0.05, mats.trofferDim, scene, node);
  lamp.position = new Vector3(WALL_X - 0.08, 1.42, 0.95);
  registry.register("lift.panel.lamp", lamp);
  registry.register("lift.panel", panel);

  // OUT OF SERVICE plaque above the doors
  const plaque = kit.wallSign("sign.lift", mats, scene, node, registry, 0.9, 0.3);
  plaque.position = new Vector3(WALL_X - 0.06, 2.78, 0);
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
