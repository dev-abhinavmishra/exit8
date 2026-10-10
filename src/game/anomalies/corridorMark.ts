import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.mark — a fresh chalk arrow on the floor near the south bench
 * points back up-corridor, with a second circled mark beside it —
 * someone's own survey notes left behind. Subtle. Ch I+.
 */
export const corridorMark: AnomalyDef = {
  id: "corridor.mark",
  displayName: "Someone's Survey Marks",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [10, 100],
  requires: ["bench.south"],
  excludes: ["corridor.tag", "corridor.scrawl"],
  testSeed: "test.corridor.mark",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const chalk = new StandardMaterial("mat.mark.chalk", ctx.scene);
    chalk.diffuseColor = new Color3(0.86, 0.85, 0.78);
    chalk.specularColor = Color3.Black();
    const made: { dispose(): void }[] = [];
    const bench = ctx.world.registry.get("bench.south");
    const bz = bench ? bench.getAbsolutePosition().z : 46;
    // shaft + two barbs of the arrow, pointing back north
    const shaft = CreateBox("anomaly.mark.shaft", { width: 0.04, height: 0.006, depth: 0.5 }, ctx.scene);
    shaft.material = chalk;
    shaft.parent = ctx.world.root;
    shaft.position.set(0.4, 0.014, bz - 1.8);
    made.push(shaft);
    for (const s of [-1, 1]) {
      const barb = CreateBox(
        `anomaly.mark.barb.${s}`,
        { width: 0.035, height: 0.006, depth: 0.22 },
        ctx.scene,
      );
      barb.material = chalk;
      barb.parent = ctx.world.root;
      barb.position.set(0.4 + s * 0.07, 0.014, bz - 1.55);
      barb.rotation.y = -s * 0.6;
      made.push(barb);
    }
    // the circled check beside it — a thin ring of four strokes
    for (let i = 0; i < 4; i++) {
      const c = CreateBox(`anomaly.mark.ring.${i}`, { width: 0.03, height: 0.006, depth: 0.16 }, ctx.scene);
      c.material = chalk;
      c.parent = ctx.world.root;
      const a = (i * Math.PI) / 2 + 0.4;
      c.position.set(0.85 + Math.cos(a) * 0.11, 0.014, bz - 1.7 + Math.sin(a) * 0.11);
      c.rotation.y = a + Math.PI / 2;
      made.push(c);
    }
    return {
      update() {},
      cleanup() {
        made.forEach((m) => m.dispose());
        chalk.dispose();
      },
    };
  },
};
