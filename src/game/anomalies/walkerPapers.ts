/**
 * walker.papers — the inspector is shedding his audit: every few
 * metres of his patrol another pale sheet lies on the terrazzo behind
 * him, facedown. Moderate: a trail that should not exist.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef, AnomalyInstance } from "./types";

const DROP_EVERY = 2.7;
const MAX_SHEETS = 9;

export const walkerPapers: AnomalyDef = {
  id: "walker.papers",
  displayName: "He Is Losing the Paperwork",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [15, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker.absent",
    "walker.midstep",
    "walker.stare",
    "walker.wait",
    "walker.notes",
    "walker.crowd",
    "walker.charge",
    "draft.sheet",
    "sheets.added",
  ],
  testSeed: "test.walker.papers",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    const walker = world.registry.mesh("ambient.walker");
    let lastZ = walker.position.z;
    // one shared sheet texture for the whole trail
    const tex = new DynamicTexture("anomaly.papers.tex", { width: 128, height: 176 }, scene, true);
    const c = tex.getContext() as unknown as CanvasRenderingContext2D;
    c.fillStyle = "#d8d4c8";
    c.fillRect(0, 0, 128, 176);
    c.fillStyle = "#9a958a";
    for (let i = 0; i < 9; i++) c.fillRect(14, 20 + i * 15, 100 - (i % 3) * 18, 3);
    c.fillStyle = "#8a2a22";
    c.fillRect(14, 158, 34, 4);
    tex.update();
    const mat = new StandardMaterial("anomaly.papers.mat", scene);
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.emissiveColor = new Color3(0.32, 0.32, 0.3);
    mat.specularColor = new Color3(0.02, 0.02, 0.02);
    // the sheets lie face-up OR face-down depending on the plane's sign
    // conventions — don't let culling hide the trail either way
    mat.backFaceCulling = false;
    const sheets: AbstractMesh[] = [];
    return {
      update() {
        const z = walker.position.z;
        if (Math.abs(z - lastZ) >= DROP_EVERY && sheets.length < MAX_SHEETS) {
          lastZ = z;
          const s = CreatePlane(`anomaly.papers.${sheets.length}`, { width: 0.22, height: 0.3 }, scene);
          s.material = mat;
          s.rotation.x = -Math.PI / 2;
          s.rotation.z = rng.range(0, Math.PI * 2);
          s.position.set(walker.position.x + rng.range(-0.16, 0.16), 0.012, z - 0.2);
          sheets.push(s);
        }
      },
      cleanup() {
        for (const s of sheets) s.dispose();
        mat.dispose();
        tex.dispose();
      },
    };
  },
};
