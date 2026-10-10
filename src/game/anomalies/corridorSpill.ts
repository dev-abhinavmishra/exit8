import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.spill — a dark spill spreads out from under the vending
 * machine, and its front glass has fogged from the inside. Floor
 * primary + fixture tell. Ch I+, moderate.
 */
export const corridorSpill: AnomalyDef = {
  id: "corridor.spill",
  displayName: "It Leaks And Fogs",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["prop.vending"],
  excludes: ["corridor.puddle", "vend.empty"],
  testSeed: "test.corridor.spill",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const vend = ctx.world.registry.get("prop.vending");
    const p = vend ? vend.getAbsolutePosition() : { x: -1.4, z: 44 };
    // spill spreads inward from the vend's wall side toward mid-corridor
    const dir = p.x > 0 ? -1 : 1;
    const spill = new StandardMaterial("mat.spill.dark", ctx.scene);
    spill.diffuseColor = new Color3(0.05, 0.04, 0.03);
    spill.specularColor = new Color3(0.55, 0.5, 0.45);
    spill.specularPower = 32;
    const made: { dispose(): void }[] = [];
    for (let i = 0; i < 3; i++) {
      const s = CreateBox(
        `anomaly.spill.pool.${i}`,
        { width: 0.5 - i * 0.14, height: 0.004, depth: 0.34 - i * 0.08 },
        ctx.scene,
      );
      s.material = spill;
      s.parent = ctx.world.root;
      s.position.set(p.x + dir * (0.5 + i * 0.16), 0.012, p.z + i * 0.1 - 0.05);
      s.rotation.y = i * 0.3;
      made.push(s);
    }
    const fog = new StandardMaterial("mat.spill.fog", ctx.scene);
    fog.diffuseColor = new Color3(0.72, 0.76, 0.78);
    fog.emissiveColor = new Color3(0.06, 0.07, 0.07);
    fog.alpha = 0.4;
    fog.specularColor = Color3.Black();
    const film = CreatePlane("anomaly.spill.fog", { width: 0.6, height: 1.1, sideOrientation: 2 }, ctx.scene);
    film.material = fog;
    film.parent = ctx.world.root;
    film.position.set(p.x + dir * 0.21, 1.35, p.z);
    film.rotation.y = p.x > 0 ? Math.PI / 2 : -Math.PI / 2;
    made.push(film);
    return {
      update() {},
      cleanup() {
        made.forEach((m) => m.dispose());
        spill.dispose();
        fog.dispose();
      },
    };
  },
};
