/**
 * washroom.gore — the staff washroom is wrong: walls bled dark rust,
 * the floor stands in bloodwater, the mirror went black, and the room
 * light burns a low red that keeps sagging. Unmistakable room-class.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const washroomGore: AnomalyDef = {
  id: "washroom.gore",
  displayName: "The Washroom Is Wrong",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [30, 100],
  requires: ["wash.mirror", "light.wash"],
  excludes: ["wash.mirror", "tap.runs", "stall.occupied", "dryer.runs"],
  testSeed: "test.washroom.gore",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    // retint the room's shared materials — they exist only in here
    const rust = new Color3(0.16, 0.05, 0.045);
    const names = ["mat.wash.tile", "mat.wash.floor", "mat.wash.stall", "mat.wash.door"];
    const saved: [StandardMaterial, Color3][] = [];
    for (const n of names) {
      const m = scene.getMaterialByName(n) as StandardMaterial | null;
      if (m) {
        saved.push([m, m.diffuseColor.clone()]);
        m.diffuseColor = rust.clone();
      }
    }
    // the mirror goes dead black
    const mirror = ctx.world.registry.mesh("wash.mirror");
    const mm = mirror.material as StandardMaterial;
    const savedMirror = mm.emissiveColor.clone();
    mm.emissiveColor = new Color3(0.01, 0.005, 0.005);
    // the room light burns low red and won't hold still
    const light = ctx.world.registry.get("light.wash") as unknown as PointLight;
    const baseDiffuse = light.diffuse.clone();
    const baseIntensity = light.intensity;
    light.diffuse = new Color3(0.75, 0.12, 0.08);
    // bloodwater standing across the floor
    const waterMat = new StandardMaterial("mat.anomaly.gorewater", scene);
    waterMat.diffuseColor = new Color3(0.1, 0.012, 0.01);
    waterMat.specularColor = new Color3(0.3, 0.07, 0.05);
    waterMat.alpha = 0.9;
    const water = CreatePlane("anomaly.gore.water", { width: 2.1, height: 3.3 }, scene);
    water.material = waterMat;
    water.position.set(3.2, 0.02, 18.25);
    water.rotation.x = -Math.PI / 2;
    let t = 0;
    let groaned = false;
    return {
      update(dt: number) {
        t += dt;
        light.intensity = baseIntensity * (0.55 + 0.25 * Math.sin(t * 2.1) + 0.08 * Math.sin(t * 9.7));
        const p = ctx.player.position;
        if (!groaned && p.x > 2.1 && p.z > 16.4 && p.z < 20.1) {
          groaned = true;
          ctx.audio.playGroan(new Vector3(3.2, 1.4, 18.25));
        }
      },
      cleanup() {
        saved.forEach(([m, c]) => (m.diffuseColor = c));
        mm.emissiveColor = savedMirror;
        light.diffuse = baseDiffuse;
        light.intensity = baseIntensity;
        water.dispose();
        waterMat.dispose();
      },
    };
  },
};
