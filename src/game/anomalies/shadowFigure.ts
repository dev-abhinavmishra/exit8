/**
 * shadow.figure — a person's shadow stands on the east wall in the
 * dark stretch, cast long toward the floor. Nothing stands between
 * it and any light. It does not move, does not leave, and does not
 * belong to you. Unmistakable once seen; easy to miss once.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef } from "./types";

export const shadowFigure: AnomalyDef = {
  id: "shadow.figure",
  displayName: "A Shadow Stands There",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["wall.right.2"],
  excludes: ["air.haze", "depth.mismatch"],
  testSeed: "test.shadow.figure",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    // soft-edged standing silhouette — head, shoulders, long coat
    // to the floor, cast a degree off vertical
    const t = new DynamicTexture("anomaly.shadow.tex", { width: 128, height: 512 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.clearRect(0, 0, 128, 512);
    const blob = (x: number, y: number, rx: number, ry: number, a: number) => {
      const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      g.addColorStop(0, `rgba(8,8,10,${a})`);
      g.addColorStop(1, "rgba(8,8,10,0)");
      c.save();
      c.translate(x, y);
      c.scale(1, ry / rx);
      c.translate(-x, -y);
      c.fillStyle = g;
      c.fillRect(x - rx, y - rx, rx * 2, rx * 2);
      c.restore();
    };
    // head + shoulders + body column + hem spread — alpha stays soft
    // so the wall panel lines ghost through; it must read as a cast
    // shadow, not a black object hung on the wall
    blob(64, 60, 20, 24, 0.62); // skull
    blob(64, 112, 34, 28, 0.6); // shoulders
    blob(64, 220, 30, 110, 0.58); // torso
    blob(58, 370, 26, 100, 0.55); // coat fall
    blob(72, 478, 40, 34, 0.5); // hem pool at the floor
    t.update();
    const mat = new StandardMaterial("anomaly.shadow.mat", scene);
    mat.diffuseTexture = t;
    mat.opacityTexture = t;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    const shadow = CreatePlane("anomaly.shadow", { width: 0.6, height: 3.1 }, scene);
    shadow.material = mat;
    const z = rng.range(40.5, 43);
    shadow.position = new Vector3(1.69, 1.55, z);
    shadow.rotation.y = Math.PI / 2; // faces -x into the corridor
    shadow.rotation.z = rng.range(-0.04, 0.04); // cast a degree off plumb
    shadow.parent = world.root;
    return {
      update() {},
      cleanup() {
        shadow.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
