/**
 * staff.door.ajar — one of the sealed staff doors in an airlock
 * vestibule stands open a crack, and a warm sliver of light bleeds
 * out of it. There is nothing behind that wall — the vestibule sides
 * are the corridor's outer shell. Moderate: it only reads in the
 * commit walk's last metres.
 */
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef, AnomalyInstance } from "./types";

const TH = 0.55; // ajar angle — a crack, not a swing

export const staffDoorAjar: AnomalyDef = {
  id: "staff.door.ajar",
  displayName: "The Staff Door Stands Ajar",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: ["sdoor.north.panel", "sdoor.south.panel"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "airlock.breach"],
  testSeed: "test.staff.door.ajar",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, world, rng } = ctx;
    // one door per run — the south vestibule's east door or the
    // north vestibule's west one, whichever the loop hands you
    const south = rng.chance(0.65);
    const leaf = world.registry.mesh(`sdoor.${south ? "south" : "north"}.panel`);
    const sx = south ? 1 : -1;
    const x0 = leaf.position.x;
    const z0 = leaf.position.z;
    const half = 0.42;
    // hinge pinned at the corridor-near edge (z0 - half); the free
    // edge swings into the vestibule. Same transform works for both
    // walls because the panels' rest rotations are already mirrored
    leaf.rotation.y = sx * (Math.PI / 2) - TH;
    leaf.position.x = x0 - sx * Math.sin(TH) * half;
    leaf.position.z = z0 - half + Math.cos(TH) * half;
    // dark void where the leaf used to sit flush — the opened doorway
    const voidMat = new StandardMaterial(`anomaly.sdoor.${south ? "s" : "n"}.vm`, scene);
    voidMat.diffuseColor = new Color3(0.008, 0.008, 0.01);
    voidMat.emissiveColor = new Color3(0.002, 0.002, 0.002);
    voidMat.specularColor = new Color3(0, 0, 0);
    const voidP = CreatePlane(`anomaly.sdoor.void`, { width: 0.8, height: 1.98 }, scene);
    voidP.material = voidMat;
    voidP.rotation.y = sx * (Math.PI / 2);
    voidP.position.set(x0 + sx * 0.012, 1.05, z0);
    // the warm sliver along the hinge — light from a place that
    // cannot exist behind the shell
    const slitMat = new StandardMaterial(`anomaly.sdoor.sm`, scene);
    slitMat.diffuseColor = new Color3(0.1, 0.08, 0.04);
    slitMat.emissiveColor = new Color3(1.0, 0.72, 0.38);
    slitMat.specularColor = new Color3(0, 0, 0);
    const slit = CreatePlane(`anomaly.sdoor.slit`, { width: 0.045, height: 1.72 }, scene);
    slit.material = slitMat;
    slit.rotation.y = sx * (Math.PI / 2);
    slit.position.set(x0 + sx * 0.018, 0.92, z0 - half + 0.03);
    const glow = new PointLight("anomaly.sdoor.glow", new Vector3(x0 - sx * 0.5, 1.3, z0 - 0.3), scene);
    glow.diffuse = new Color3(1.0, 0.74, 0.42);
    glow.intensity = 0.32;
    glow.range = 2.2;
    return {
      update() {},
      cleanup() {
        leaf.rotation.y = sx * Math.PI * 0.5;
        leaf.position.x = x0;
        leaf.position.z = z0;
        glow.dispose();
        slit.dispose();
        slitMat.dispose();
        voidP.dispose();
        voidMat.dispose();
      },
    };
  },
};
