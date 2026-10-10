/**
 * totem.fallen — the mid-route INSPECTION LOOP 7 totem isn't hanging
 * anymore; it's lying on the terrazzo beneath its own rods, face up,
 * with the two mount stubs dropped beside it. Loud spatial-class
 * anomaly — the corridor's furniture has started coming down.
 */

import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { drawSign } from "../../world/generation/textures";
import { SIGNS } from "../../data/signage";
import type { AnomalyDef, AnomalyInstance } from "./types";

const SPEC_ID = "sign.totem.mid";

export const totemFallen: AnomalyDef = {
  id: "totem.fallen",
  displayName: "Totem Sign on the Floor",
  chapter: 2,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [15, 100],
  requires: [`sign.${SPEC_ID}`],
  excludes: ["totem.gone", "totem.reversed", "totem.sways", "sign.mirror", "sign.loop8"],
  testSeed: "test.totem.fallen",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const spec = SIGNS.find((s) => s.id === SPEC_ID);
    const hanging = world.registry.mesh(`sign.${SPEC_ID}`);
    if (!spec || !hanging) return { update() {}, cleanup() {} };
    hanging.setEnabled(false);

    const parent = new TransformNode("anomaly.totem.fallen", scene);
    parent.parent = world.root;
    parent.position.set(ctx.rng.range(-0.5, 0.5), 0.02, ctx.rng.range(37.4, 38.6));
    parent.rotation.y = ctx.rng.range(-0.5, 0.5);

    const t = new DynamicTexture("anomaly.totem.fallen.tex", { width: 512, height: 160 }, scene, true);
    drawSign(t, spec);
    const mat = new StandardMaterial("anomaly.totem.fallen.mat", scene);
    mat.diffuseTexture = t;
    mat.emissiveTexture = t;
    mat.emissiveColor = new Color3(0.8, 0.8, 0.8);
    mat.specularColor = Color3.Black();
    mat.backFaceCulling = false; // flipped-x face would otherwise cull
    const face = CreateBox("anomaly.totem.fallen.face", { width: 1.3, height: 0.006, depth: 0.42 }, scene);
    face.material = mat;
    face.parent = parent;
    // Babylon draws plane textures mirrored when viewed from +y — flip x
    face.scaling.x = -1;

    // the two mount stubs it came down from
    const stubMat = world.materials.rubber;
    for (const sx of [-0.45, 0.45]) {
      const stub = CreateCylinder("anomaly.totem.fallen.stub", { diameter: 0.02, height: 0.34 }, scene);
      stub.material = stubMat;
      stub.parent = parent;
      stub.position.set(sx + ctx.rng.range(-0.15, 0.15), 0.01, ctx.rng.range(0.5, 0.8));
      stub.rotation.z = Math.PI / 2;
      stub.rotation.x = ctx.rng.range(-0.4, 0.4);
    }

    return {
      update() {},
      cleanup() {
        parent.dispose(false, true);
        hanging.setEnabled(true);
      },
    };
  },
};
