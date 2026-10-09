/**
 * archives.slam — the archives door stands open like archives.open,
 * but step inside the stacks and the leaf slams shut behind you and
 * the glow dies: alone in the dark for a beat before it creaks back
 * open. Unmistakable; the walkable room is the trap.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { AnomalyDef, AnomalyInstance } from "./types";

const LEAF_X = -1.65;
const LEAF_Z = 22.1;
const OPEN_TH = 1.05;
// room bounds x -4.35..-1.8 — "inside" is past the wall plane
const INSIDE_X = -1.82;

export const archivesSlam: AnomalyDef = {
  id: "archives.slam",
  displayName: "It Shut Behind You",
  chapter: 3,
  category: "spatial",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [40, 100],
  requires: ["archives.door.leaf"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "archives.open", "archives.staffed"],
  testSeed: "test.archives.slam",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world } = ctx;
    const savedMats: [StandardMaterial, Color3][] = [];
    const leaf = world.registry.mesh("archives.door.leaf");
    leaf.rotation.y = -OPEN_TH;
    leaf.position.x = LEAF_X - Math.sin(OPEN_TH) * 0.53;
    leaf.position.z = LEAF_Z - 0.53 + Math.cos(OPEN_TH) * 0.53;

    const glow = new PointLight("anomaly.archives.slamglow", new Vector3(-2.6, 1.35, 22.1), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.45);
    glow.intensity = 0.85;
    glow.range = 4.6;

    let phase: "armed" | "slamming" | "dark" | "reopening" | "spent" = "armed";
    let t = 0;
    let told = false;

    return {
      update(dt) {
        if (phase === "armed") {
          if (!told && ctx.player.position.x < -0.4) {
            told = true;
            ctx.audio.caption("the archives are open", new Vector3(LEAF_X, 1.2, LEAF_Z));
          }
          const p = ctx.player.position;
          if (p.x < INSIDE_X && p.z > 21.42 && p.z < 22.78) {
            phase = "slamming";
            t = 0;
            ctx.audio.playSlam(new Vector3(LEAF_X, 1.4, LEAF_Z));
            ctx.player.jolt(0.35);
          }
          return;
        }
        if (phase === "slamming") {
          t += dt;
          const k = Math.min(1, t / 0.22);
          const th = OPEN_TH * (1 - k * k);
          leaf.rotation.y = -th;
          leaf.position.x = LEAF_X - Math.sin(th) * 0.53;
          leaf.position.z = LEAF_Z - 0.53 + Math.cos(th) * 0.53;
          glow.intensity = 0.85 * (1 - k);
          if (k >= 1) {
            leaf.rotation.y = 0;
            leaf.position.x = LEAF_X;
            leaf.position.z = LEAF_Z;
            phase = "dark";
            t = 0;
            for (const n of ["mat.archives.wash", "mat.archives.pad"]) {
              const m = scene.getMaterialByName(n) as StandardMaterial | null;
              if (m) {
                savedMats.push([m, m.emissiveColor.clone()]);
                m.emissiveColor.scaleInPlace(0.05);
              }
            }
            ctx.audio.caption("it shut behind you", null);
          }
          return;
        }
        if (phase === "dark") {
          t += dt;
          if (t > 3.2) {
            phase = "reopening";
            t = 0;
            for (const [m, c] of savedMats) m.emissiveColor = c;
            savedMats.length = 0;
            ctx.audio.playScrape(new Vector3(LEAF_X, 1.4, LEAF_Z));
          }
          return;
        }
        if (phase === "reopening") {
          t += dt;
          const k = Math.min(1, t / 1.6);
          const th = OPEN_TH * k * k;
          leaf.rotation.y = -th;
          leaf.position.x = LEAF_X - Math.sin(th) * 0.53;
          leaf.position.z = LEAF_Z - 0.53 + Math.cos(th) * 0.53;
          glow.intensity = 0.85 * k;
          if (k >= 1) phase = "spent";
        }
      },
      cleanup() {
        for (const [m, c] of savedMats) m.emissiveColor = c;
        leaf.rotation.y = 0;
        leaf.position.x = LEAF_X;
        leaf.position.z = LEAF_Z;
        glow.dispose();
      },
    };
  },
};
