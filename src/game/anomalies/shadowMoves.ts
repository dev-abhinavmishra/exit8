/**
 * shadow.moves — the same kind of figure-shadow as shadow.figure,
 * cast on the east wall by nobody, except this one drifts. Slowly —
 * a half-metre slide over half a minute — so you catch it on the
 * second glance, not the first.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const shadowMoves: AnomalyDef = {
  id: "shadow.moves",
  displayName: "The Shadow Drifts",
  chapter: 3,
  category: "object",
  detectability: "moderate",
  weight: 0.6,
  progressionRange: [40, 100],
  requires: ["wall.right.2a"],
  excludes: ["shadow.figure", "air.haze", "depth.mismatch"],
  testSeed: "test.shadow.moves",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const t = new DynamicTexture("anomaly.shadowm.tex", { width: 128, height: 512 }, scene, true);
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
      c.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      c.restore();
    };
    // same standing silhouette, one arm slightly raised — a pose the
    // static version never strikes
    blob(64, 60, 20, 24, 0.62); // skull
    blob(64, 112, 34, 28, 0.6); // shoulders
    blob(64, 220, 30, 110, 0.58); // torso
    blob(58, 370, 26, 100, 0.55); // coat fall
    blob(96, 150, 14, 52, 0.52); // the raised arm
    blob(72, 478, 40, 34, 0.5); // hem pool at the floor
    t.update();
    const mat = new StandardMaterial("anomaly.shadowm.mat", scene);
    mat.diffuseTexture = t;
    mat.opacityTexture = t;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    const shadow = CreatePlane("anomaly.shadowm", { width: 0.6, height: 3.1 }, scene);
    shadow.material = mat;
    const z0 = rng.range(43.5, 45);
    shadow.position = new Vector3(1.69, 1.55, z0);
    shadow.rotation.y = Math.PI / 2;
    shadow.rotation.z = rng.range(-0.04, 0.04);
    shadow.parent = world.root;
    let phase = rng.range(0, Math.PI * 2);
    const tilt0 = shadow.rotation.z;
    return {
      update(dt) {
        // ~28s period, ±0.9m drift + a faint lean — the shadow walks
        // a beat nobody casts
        phase += dt * 0.22;
        shadow.position.z = z0 + Math.sin(phase) * 0.9;
        shadow.rotation.z = tilt0 + Math.sin(phase * 0.7) * 0.05;
      },
      cleanup() {
        shadow.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
