import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * hatch.hand — the west access panel z10.5 stands ajar and a pale hand
 * grips its edge from inside the wall. It does not move. Unmistakable.
 */
export const hatchHand: AnomalyDef = {
  id: "hatch.hand",
  displayName: "A Hand In The Panel",
  chapter: 3,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [30, 100],
  requires: ["svc.panel.1"],
  excludes: ["panel.open", "figure.corridor", "figure.south", "figure.north", "figure.corner"],
  testSeed: "test.hatch.hand",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const pn = world.registry.mesh("svc.panel.1");
    const face = pn.getChildMeshes(false).find((m) => m.name.endsWith(".face"));
    if (face) {
      face.setPivotPoint(new Vector3(0, 0, -0.26));
      face.rotation.y = 0.55; // ajar — enough for the grip
    }
    const dark = CreateBox("anomaly.hatch.dark", { width: 0.015, height: 0.5, depth: 0.3 }, scene);
    dark.material = world.materials.rubber;
    dark.parent = world.root;
    dark.position.set(-1.66, 1.35, 10.62);
    const skin = new StandardMaterial("mat.hatch.hand", scene);
    skin.diffuseColor = new Color3(0.72, 0.64, 0.56);
    skin.specularColor = new Color3(0.1, 0.09, 0.08);
    const palm = CreateCapsule(
      "anomaly.hatch.palm",
      { radius: 0.045, height: 0.14, tessellation: 10 },
      scene,
    );
    palm.material = skin;
    palm.parent = world.root;
    palm.position.set(-1.615, 1.32, 10.68);
    palm.rotation.z = Math.PI / 2;
    const parts: string[] = [dark.name, palm.name];
    for (let f = 0; f < 4; f++) {
      const fin = CreateCapsule(
        `anomaly.hatch.finger.${f}`,
        { radius: 0.013, height: 0.075, tessellation: 8 },
        scene,
      );
      fin.material = skin;
      fin.parent = world.root;
      fin.position.set(-1.615, 1.36 - f * 0.028, 10.78);
      fin.rotation.x = -0.7;
      parts.push(fin.name);
    }
    return {
      update() {},
      cleanup() {
        if (face) {
          face.rotation.y = 0;
          face.setPivotPoint(Vector3.Zero());
        }
        for (const n of parts) scene.getMeshByName(n)?.dispose();
        skin.dispose();
      },
    };
  },
};
