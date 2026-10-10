/**
 * camera.tracks — the corridor's CCTV domes follow you. Baseline they
 * hold a fixed aim down the run; under the anomaly every dome within
 * sight pans to keep its lens on your position as you walk — a slow
 * motorized sweep, not a snap. Moderate: you have to look up to catch
 * it, and once you see one turn you check them all.
 */
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnomalyDef, AnomalyInstance } from "./types";

const CAMS = ["cctv.0", "cctv.1", "cctv.2", "cctv.3"];
// servos don't snap — the pan eases toward you
const PAN_RATE = 1.7;

export const cameraTracks: AnomalyDef = {
  id: "camera.tracks",
  displayName: "The Cameras Watch",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [20, 100],
  requires: ["cctv.0", "cctv.1", "cctv.2", "cctv.3"],
  // world-root transforms invalidate the local-space aim math
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow"],
  testSeed: "test.camera.tracks",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world, player } = ctx;
    const cams = CAMS.map((n) => world.registry.get(n)) as TransformNode[];
    const baseYaw = cams.map((c) => c.rotation.y);
    const yaw = [...baseYaw];
    return {
      update(dt) {
        for (let i = 0; i < cams.length; i++) {
          const c = cams[i]!;
          const want = Math.atan2(player.position.x - c.position.x, player.position.z - c.position.z);
          let d = want - yaw[i]!;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          yaw[i]! += d * Math.min(1, dt * PAN_RATE);
          c.rotation.y = yaw[i]!;
        }
      },
      cleanup() {
        for (let i = 0; i < cams.length; i++) cams[i]!.rotation.y = baseYaw[i]!;
      },
    };
  },
};
