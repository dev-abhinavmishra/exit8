import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.breath — a cold patch at the east wall z 27: frost film
 * creeps over the tiles while the zone's light goes a shade cooler,
 * and a caption notes your breath fogging. Lighting + object tell.
 * Ch II+, moderate.
 */
export const corridorBreath: AnomalyDef = {
  id: "corridor.breath",
  displayName: "A Cold Patch",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["light.zone.entry"],
  excludes: ["light.cold", "corridor.cold"],
  testSeed: "test.corridor.breath",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zone = ctx.world.zones[0]!;
    const cool = new Color3(0.55, 0.7, 0.95);
    const d0 = zone.point.diffuse.clone();
    const i0 = zone.point.intensity;
    zone.point.diffuse = cool;
    zone.point.intensity = i0 * 0.82;
    const frost = new StandardMaterial("mat.breath.frost", ctx.scene);
    frost.diffuseColor = new Color3(0.75, 0.82, 0.9);
    frost.emissiveColor = new Color3(0.1, 0.12, 0.15);
    frost.alpha = 0.35;
    frost.specularColor = Color3.Black();
    const film = CreatePlane(
      "anomaly.breath.film",
      { width: 0.02, height: 1.3, sideOrientation: 2 },
      ctx.scene,
    );
    film.material = frost;
    film.parent = ctx.world.root;
    film.position.set(1.735, 1.5, 27);
    film.rotation.y = Math.PI / 2;
    film.scaling.z = 2.6;
    let told = false;
    let t = 0;
    return {
      update(dt: number) {
        t += dt;
        if (!told && t > 1.2) {
          told = true;
          ctx.audio.caption("your breath fogs", null);
        }
      },
      cleanup() {
        zone.point.diffuse = d0;
        zone.point.intensity = i0;
        film.dispose();
        frost.dispose();
      },
    };
  },
};
