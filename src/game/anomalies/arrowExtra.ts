/**
 * arrow.extra — a fourth route mark appears: another worn arrow on the
 * terrazzo, off the established sequence — deeper south past the last
 * real decal, on the wrong side of the lane, still pointing south like
 * it belongs. Subtle because it imitates the set almost perfectly.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const arrowExtra: AnomalyDef = {
  id: "arrow.extra",
  displayName: "A Fourth Route Mark",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.8,
  progressionRange: [10, 100],
  requires: ["route.decal.0"],
  excludes: ["arrows.gone", "arrow.points"],
  testSeed: "test.arrow.extra",
  dangerous: false,
  activate(ctx) {
    const ref = ctx.world.registry.get("route.decal.0");
    const mat = ref && "material" in ref ? (ref as { material: unknown }).material : null;
    const d = CreatePlane(
      "anomaly.route.decal.extra",
      { width: 0.42, height: 0.66, sideOrientation: Mesh.DOUBLESIDE },
      ctx.scene,
    );
    if (mat) d.material = mat as never;
    d.parent = ctx.world.root;
    d.rotation.x = -Math.PI / 2;
    d.rotation.z = Math.PI;
    // off-sequence: opposite lane edge, south of the real run's spacing
    d.position = new Vector3(-0.85, 0.012, 51.2);
    return {
      update() {},
      cleanup() {
        d.dispose();
      },
    };
  },
};
