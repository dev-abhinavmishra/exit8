/**
 * niche.thermos.steam — a thin wisp rises off the thermos on the nook's
 * shelf: it was just poured. Somebody stood here seconds ago.
 */
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { AnomalyDef } from "./types";

export const nicheThermosSteam: AnomalyDef = {
  id: "niche.thermos.steam",
  displayName: "Steam Off the Thermos",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 1,
  progressionRange: [10, 100],
  requires: ["niche.thermos"],
  excludes: ["niche.shelf.bare"],
  testSeed: "test.niche.thermos.steam",
  dangerous: false,
  activate(ctx) {
    const scene = ctx.scene;
    const thermos = ctx.world.registry.get("niche.thermos");
    if (!thermos) return { update() {}, cleanup() {} };
    const mat = new StandardMaterial("niche.steam.mat", scene);
    mat.diffuseColor = Color3.White();
    mat.emissiveColor = new Color3(0.5, 0.52, 0.55);
    mat.alpha = 0.35;
    const wisps: Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const w = MeshBuilder.CreateDisc(`niche.steam.${i}`, { radius: 0.035 + i * 0.02 }, scene);
      w.material = mat;
      w.billboardMode = 7;
      w.position = thermos.getAbsolutePosition().add(new Vector3(0, 0.11 + i * 0.07, 0));
      wisps.push(w);
    }
    let t = 0;
    return {
      update(dt) {
        t += dt;
        for (let i = 0; i < wisps.length; i++) {
          const w = wisps[i]!;
          if (!w) continue;
          const ph = (t * 0.35 + i / wisps.length) % 1;
          w.position.y = thermos.getAbsolutePosition().y + 0.11 + ph * 0.42;
          w.position.x = thermos.getAbsolutePosition().x + Math.sin(t * 1.7 + i * 2.1) * 0.03;
          const s = 0.5 + ph * 1.6;
          w.scaling.setAll(s);
        }
        mat.alpha = 0.4 - ((t * 0.35) % 1) * 0.25;
      },
      cleanup() {
        for (const w of wisps) w.dispose();
        mat.dispose();
      },
    };
  },
};
