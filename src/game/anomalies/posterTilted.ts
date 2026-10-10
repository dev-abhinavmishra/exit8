/**
 * poster.tilted — one poster in the notice row hangs crooked in its
 * frame, leaned a few degrees off level. Subtle object-class anomaly.
 */
import type { AnomalyDef } from "./types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";

export const posterTilted: AnomalyDef = {
  id: "poster.tilted",
  displayName: "Poster Hangs Crooked",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["poster.0", "poster.1", "poster.2"],
  excludes: ["wall.left.poster", "poster.swapped", "poster.changed", "poster.dup", "posters.mirror"],
  testSeed: "test.poster.tilted",
  dangerous: false,
  activate(ctx) {
    const i = ctx.rng.int(0, 3);
    const p = ctx.world.registry.mesh(`poster.${i}`);
    const rz = p.rotation.z;
    p.rotation.z = rz + ctx.rng.pick([-0.16, 0.16]);
    // second tell — a fresh scratch streak trails below the frame
    const scratchMat = new StandardMaterial("mat.anomaly.scratch", ctx.scene);
    scratchMat.diffuseColor = new Color3(0.05, 0.045, 0.04);
    scratchMat.alpha = 0.5;
    const pp = p.getAbsolutePosition();
    const scratch = CreatePlane("anomaly.poster.scratch", { width: 0.05, height: 0.7 }, ctx.scene);
    scratch.material = scratchMat;
    scratch.position.set(pp.x + 0.005, pp.y - 0.52, pp.z + 0.18);
    scratch.rotation.y = -Math.PI / 2; // west wall, face +x
    scratch.rotation.z = 0.35;
    return {
      update() {},
      cleanup() {
        p.rotation.z = rz;
        scratch.dispose();
        scratchMat.dispose();
      },
    };
  },
};
