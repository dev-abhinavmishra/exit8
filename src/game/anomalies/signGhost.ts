/**
 * sign.ghost — a hanging sign you have never read hangs mid-corridor,
 * same rods, same panel stock, same institutional lettering. It was
 * not installed between loops. It was always there.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { AnomalyDef } from "./types";
import { drawSign } from "../../world/generation/textures";

export const signGhost: AnomalyDef = {
  id: "sign.ghost",
  displayName: "The New Sign",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.65,
  progressionRange: [35, 100],
  requires: ["sign.sign.totem.north"],
  excludes: ["sign", "totem"],
  testSeed: "test.sign.ghost",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const t = new DynamicTexture("anomaly.ghostsign.tex", { width: 512, height: 160 }, scene, true);
    t.hasAlpha = false;
    drawSign(t, {
      id: "sign.ghost",
      title: rng.pick(["NO RE-ENTRY", "KEEP MOVING", "COUNT YOUR STEPS"]),
      sub: rng.pick(["ROUTE 7 SEALED AT SURVEY LINE", "DO NOT STOP BETWEEN LAMPS"]),
      arrow: "none",
      tone: "amber",
    });
    const mat = new StandardMaterial("anomaly.ghostsign.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveColor = new Color3(0.45, 0.45, 0.45); // same recipe as built-in sign mats
    mat.specularColor = new Color3(0.02, 0.02, 0.02);
    mat.backFaceCulling = false;

    const z = rng.pick([18, 26.5, 38]);
    // dual-face hanging sign: two planes back to back, readable both ways
    const faces: AbstractMesh[] = [];
    for (const side of [1, -1]) {
      const p = CreatePlane(
        `anomaly.ghostsign.panel${side === 1 ? "N" : "S"}`,
        { width: 1.6, height: 0.5 },
        scene,
      );
      p.material = mat;
      p.position = new Vector3(0, 2.55, z + side * 0.012);
      if (side === -1) p.rotation.y = Math.PI;
      // Babylon plane fronts draw textures mirrored — flip so the face reads correctly
      p.scaling.x = -1;
      p.parent = world.root;
      faces.push(p);
    }
    const rod = CreateBox("anomaly.ghostsign.rod", { width: 0.03, height: 0.35, depth: 0.03 }, scene);
    rod.material = world.materials.steel;
    rod.position = new Vector3(0, 2.88, z);
    rod.parent = world.root;

    return {
      update() {},
      cleanup() {
        for (const p of faces) p.dispose();
        faces.length = 0;
        rod.dispose();
        mat.dispose();
        t.dispose();
      },
    };
  },
};
