/**
 * Baseline fixtures — the corridor furniture that makes the space read as
 * a working institution rather than a rendering of one: a fire point, a
 * waiting bench, a service bin. Fixed every loop (they are anchors, so a
 * fixture anomaly can later move/remove them), never registered with the
 * scatter pool.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
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
}
