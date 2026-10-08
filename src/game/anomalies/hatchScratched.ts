/**
 * hatch.scratched — the always-shut service hatch has been worked on
 * from the inside: fresh score marks radiate out from under its edges
 * across the wall panels. Nothing opened it — something tried to.
 * Moderate.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef } from "./types";

export const hatchScratched: AnomalyDef = {
  id: "hatch.scratched",
  displayName: "Scored From Inside",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [25, 100],
  requires: ["hatch.plate"],
  excludes: ["hatch.open", "hatch.knocks", "hatch.gone"],
  testSeed: "test.hatch.scratched",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const plate = world.registry.mesh("hatch.plate");
    // score marks on a transparent decal — pale fresh-metal grooves
    // fanned out from the plate's rim
    const t = new DynamicTexture("anomaly.scratched.tex", { width: 256, height: 256 }, scene, true);
    const c = t.getContext() as unknown as CanvasRenderingContext2D;
    c.clearRect(0, 0, 256, 256);
    c.lineCap = "round";
    for (let i = 0; i < 22; i++) {
      const a = rng.range(-0.5, 0.5) + (i / 22) * Math.PI * 2;
      const r0 = rng.range(60, 82);
      const r1 = r0 + rng.range(14, 38);
      const x0 = 128 + Math.cos(a) * r0;
      const y0 = 128 + Math.sin(a) * r0;
      const x1 = 128 + Math.cos(a + rng.range(-0.1, 0.1)) * r1;
      const y1 = 128 + Math.sin(a + rng.range(-0.1, 0.1)) * r1;
      c.strokeStyle = "rgba(202,196,180,0.85)";
      c.lineWidth = rng.range(2.4, 3.6);
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
      c.strokeStyle = "rgba(30,27,24,0.85)";
      c.lineWidth = rng.range(1.1, 1.9);
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    }
    t.update();
    const mat = new StandardMaterial("anomaly.scratched.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    mat.opacityTexture = t;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    const scar = CreatePlane("anomaly.scratched", { width: 1.35, height: 1.35 }, scene);
    scar.material = mat;
    scar.position = new Vector3(plate.position.x - 0.03, plate.position.y, plate.position.z);
    scar.rotation.y = Math.PI / 2; // faces -x into the corridor
    scar.parent = world.root;
    return {
      update() {},
      cleanup() {
        scar.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
