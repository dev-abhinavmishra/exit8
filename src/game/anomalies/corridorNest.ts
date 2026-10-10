import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.nest — a rat's shredded-paper nest tucked behind the south
 * bench, and the bench's near leg chewed to a splinter so the seat
 * dips on that corner. Primary trace + fixture tell. Ch II+, moderate.
 */
export const corridorNest: AnomalyDef = {
  id: "corridor.nest",
  displayName: "Something Nests Here",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["bench.south"],
  excludes: ["corridor.rat", "bench.moved"],
  testSeed: "test.corridor.nest",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const shred = new StandardMaterial("mat.nest.shred", ctx.scene);
    shred.diffuseColor = new Color3(0.62, 0.58, 0.5);
    shred.specularColor = Color3.Black();
    const made: { dispose(): void }[] = [];
    const bench = ctx.world.registry.get("bench.south");
    const p = bench ? bench.getAbsolutePosition() : { x: -1.4, z: 46 };
    // the nest — a low mound of scraps against the wall behind the seat
    for (let i = 0; i < 12; i++) {
      const m = CreateBox(
        `anomaly.nest.shred.${i}`,
        { width: 0.05 + (i % 4) * 0.03, height: 0.02, depth: 0.05 },
        ctx.scene,
      );
      m.material = shred;
      m.parent = ctx.world.root;
      const a = (i / 12) * Math.PI * 2;
      m.position.set(p.x - 0.3 + Math.cos(a) * 0.14, 0.03 + (i % 3) * 0.012, p.z + Math.sin(a) * 0.1);
      m.rotation.y = a * 1.7;
      made.push(m);
    }
    // chewed leg tell — tilt the whole bench a few degrees on the near end
    const rot0 = bench.rotation.clone();
    bench.rotation.z = (bench.rotation.z ?? 0) + 0.045;
    return {
      update() {},
      cleanup() {
        bench.rotation.copyFrom(rot0);
        made.forEach((m) => m.dispose());
        shred.dispose();
      },
    };
  },
};
