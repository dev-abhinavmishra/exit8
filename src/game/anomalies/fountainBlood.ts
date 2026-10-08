/**
 * fountain.blood — the drinking fountain runs, but what stands over
 * the bubbler and pools across the basin and floor is dark and
 * rust-red, glossy like wet paint. Unmistakable object-class anomaly.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const fountainBlood: AnomalyDef = {
  id: "fountain.blood",
  displayName: "The Fountain Runs Red",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [35, 100],
  requires: ["prop.fountain"],
  excludes: ["fountain.runs", "fountain.gone"],
  testSeed: "test.fountain.blood",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const fountain = world.registry.get("prop.fountain");
    const spawned: { dispose(): void }[] = [];
    const cleanups: (() => void)[] = [];

    const blood = new StandardMaterial("anomaly.fountain.blood", scene);
    blood.diffuseColor = new Color3(0.2, 0.012, 0.012);
    blood.specularColor = new Color3(0.8, 0.35, 0.35);
    blood.specularPower = 32;
    blood.emissiveColor = new Color3(0.05, 0.004, 0.004);
    spawned.push(blood);

    // the basin itself turns — the fixture's whole face reads wrong
    const basin = fountain.getChildMeshes().find((m) => m.name === "prop.fountain.basin");
    if (basin) {
      const m0 = basin.material;
      basin.material = blood;
      cleanups.push(() => {
        basin.material = m0;
      });
    }

    const bubbler = fountain.getChildMeshes().find((m) => m.name === "prop.fountain.bubbler");
    if (bubbler) {
      const y = bubbler.position.y;
      bubbler.position.y = y + 0.025;
      cleanups.push(() => {
        bubbler.position.y = y;
      });
    }

    const jet = CreateBox("anomaly.fountain.bjet", { width: 0.022, height: 0.075, depth: 0.022 }, scene);
    jet.material = blood;
    jet.parent = fountain;
    jet.position = new Vector3(-0.02, 0.16, -0.12);
    spawned.push(jet);

    const pool = CreatePlane("anomaly.fountain.bpool", { width: 0.19, height: 0.27 }, scene);
    pool.material = blood;
    pool.parent = fountain;
    pool.rotation.x = -Math.PI / 2;
    pool.position = new Vector3(-0.14, 0.101, 0.02);
    spawned.push(pool);

    const floorPool = CreatePlane("anomaly.fountain.bfloor", { width: 1.1, height: 1.2 }, scene);
    floorPool.material = blood;
    floorPool.parent = fountain;
    floorPool.rotation.x = -Math.PI / 2;
    floorPool.position = new Vector3(-0.32, -0.838, 0.1);
    spawned.push(floorPool);

    return {
      update() {},
      cleanup() {
        for (const c of cleanups) c();
        for (const s of spawned) s.dispose();
      },
    };
  },
};
