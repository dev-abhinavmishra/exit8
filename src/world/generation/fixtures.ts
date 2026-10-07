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
