/**
 * chalk.marks — a cluster of fresh tally marks is scratched into the west
 * wall panels past the records bank, at chest height, where the enamel
 * was clean. Subtle: five-barred gates, counting something. Nobody in
 * the building carries chalk.
 */
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef } from "./types";

export const chalkMarks: AnomalyDef = {
  id: "chalk.marks",
  displayName: "Tally Marks",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [0, 100],
  requires: ["wall.left.2", "wall.left.3"],
  excludes: [],
  testSeed: "test.chalk.marks",
  dangerous: false,
  activate(ctx) {
    const { scene, world, rng } = ctx;
    const created: AbstractMesh[] = [];

    const chalk = new StandardMaterial("anomaly.chalk.mat", scene);
    chalk.diffuseColor = new Color3(0.82, 0.82, 0.78);
    chalk.emissiveColor = new Color3(0.18, 0.18, 0.17);
    chalk.alpha = 0.85;
    chalk.disableLighting = true;
    chalk.backFaceCulling = false;

    // gates of five: |||| with a diagonal strike. 1-3 clusters, seeded
    const groups = rng.int(1, 3);
    // keep clusters off the S-2 bay mouth (z 46.2–49.4) — chalk must
    // land on wall, not float over the opening
    const baseZ = rng.draw() < 0.72 ? rng.range(34, 45.3) : rng.range(49.6, 51.6);
    const baseY = rng.range(1.15, 1.7);
    const wx = -1.74 + 0.008; // west wall inner face + a skin of air
    let g = 0;
    for (let group = 0; group < groups; group++) {
      const gz = baseZ + group * 0.42 + rng.range(-0.04, 0.04);
      const gy = baseY + rng.range(-0.06, 0.06);
      for (let s = 0; s < 4; s++) {
        const m = CreateBox(`anomaly.chalk.${g}`, { width: 0.012, height: 0.27, depth: 0.03 }, scene);
        m.material = chalk;
        m.position = new Vector3(wx, gy, gz + s * 0.055);
        m.rotation.x = rng.range(-0.06, 0.06); // slight hand-wobble
        m.parent = world.root;
        created.push(m);
        g++;
      }
      const slash = CreateBox(`anomaly.chalk.${g}`, { width: 0.012, height: 0.34, depth: 0.028 }, scene);
      slash.material = chalk;
      slash.position = new Vector3(wx, gy - 0.01, gz + 0.085);
      slash.rotation.x = 0.62 + rng.range(-0.08, 0.08); // the cross-stroke
      slash.parent = world.root;
      created.push(slash);
      g++;
    }

    return {
      update() {},
      cleanup() {
        for (const m of created) m.dispose();
        created.length = 0;
        chalk.dispose();
      },
    };
  },
};
