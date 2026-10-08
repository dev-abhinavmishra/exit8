/**
 * ceiling.crack — a hairline fracture has crawled across the ceiling
 * tiles overhead, a jagged dark vein between the troffers. Subtle
 * spatial-class anomaly drawn live as an alpha decal.
 */
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef } from "./types";

export const ceilingCrack: AnomalyDef = {
  id: "ceiling.crack",
  displayName: "Ceiling Fracture",
  chapter: 3,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [20, 100],
  requires: ["ceiling.vent.8"],
  excludes: ["ceiling"],
  testSeed: "test.ceiling.crack",
  dangerous: false,
  activate(ctx) {
    const { scene, rng } = ctx;
    const tex = new DynamicTexture("anomaly.ceilingCrack.tex", { width: 512, height: 256 }, scene, true);
    tex.hasAlpha = true;
    const c = tex.getContext() as unknown as CanvasRenderingContext2D;
    c.clearRect(0, 0, 512, 256);
    // a main vein with 2-4 side branches — darkened split + fine glaze
    // shadow so it reads as a fracture, not a drawn line
    const vein = (x0: number, y0: number, ang: number, len: number, w: number) => {
      let x = x0;
      let y = y0;
      let a = ang;
      for (let i = 0; i < len; i++) {
        const step = 6 + rng.draw() * 9;
        const nx = x + Math.cos(a) * step;
        const ny = y + Math.sin(a) * step;
        // glaze-chip halo first: a fresh fracture catches light at its
        // lip, which is what makes it read on the dark tee-bar grid
        c.strokeStyle = "rgba(212,205,190,0.5)";
        c.lineWidth = w * (1 - i / len) + 3.4;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(nx, ny);
        c.stroke();
        c.strokeStyle = `rgba(28,24,20,${0.72 + rng.draw() * 0.26})`;
        c.lineWidth = w * (1 - i / len) + 0.5;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(nx, ny);
        c.stroke();
        x = nx;
        y = ny;
        a += (rng.draw() - 0.5) * 0.9;
      }
      return [x, y, a] as const;
    };
    let [x, y] = [60 + rng.draw() * 80, 110 + rng.draw() * 40];
    let ang = (rng.draw() - 0.5) * 0.4;
    for (let seg = 0; seg < 5; seg++) {
      const [nx, ny, na] = vein(x, y, ang, 4 + rng.int(0, 5), 3.2);
      // branch off mid-vein
      if (rng.chance(0.75))
        vein(nx - 20, ny - 4, na + (rng.chance(0.5) ? 0.9 : -0.9), 3 + rng.int(0, 4), 1.6);
      x = nx;
      y = ny;
      ang = na + (rng.draw() - 0.5) * 0.5;
    }
    tex.update();

    const mat = new StandardMaterial("anomaly.ceilingCrack.mat", scene);
    mat.diffuseTexture = tex;
    mat.useAlphaFromDiffuseTexture = true;
    mat.emissiveTexture = tex;
    mat.emissiveColor = new Color3(0.45, 0.45, 0.45);
    mat.disableLighting = true;
    mat.alphaMode = 2;
    mat.backFaceCulling = false;
    const z = rng.range(18, 42);
    const plane = CreatePlane("anomaly.ceilingCrack", { width: 4.4, height: 2.2 }, scene);
    plane.material = mat;
    plane.position = new Vector3(rng.range(-0.7, 0.7), 2.965, z);
    plane.rotation.x = Math.PI / 2; // face down
    plane.rotation.z = rng.range(-0.4, 0.4);
    return {
      update() {},
      cleanup() {
        plane.dispose();
        mat.dispose();
        tex.dispose();
      },
    };
  },
};
