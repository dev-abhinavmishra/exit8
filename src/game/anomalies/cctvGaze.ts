/**
 * cctv.gaze — the camera over the clinic bend turns to follow you. The red
 * lens glint sweeps as it tracks; out of range it settles back to its
 * baseline watch down the corridor. Subtle but deeply wrong.
 */
import type { AnomalyDef } from "./types";

const CAM_ID = "cctv.2";
const CAM_X = -1.6;
const CAM_Z = 40;
const BASE_YAW = Math.PI; // baseline: watches north (z<27 rule gives π here)
const RANGE = 12;

export const cctvGaze: AnomalyDef = {
  id: "cctv.gaze",
  displayName: "Attentive Camera",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: [CAM_ID],
  excludes: ["cctv"],
  testSeed: "test.cctv.gaze",
  dangerous: false,
  activate(ctx) {
    const cam = ctx.world.registry.get(CAM_ID);
    const camRoot = cam as { rotation: { y: number }; position: { x: number; z: number } };
    const home = camRoot.rotation.y;
    return {
      update(dt) {
        const p = ctx.player.position;
        const dx = p.x - CAM_X;
        const dz = p.z - CAM_Z;
        const dist = Math.hypot(dx, dz);
        const want = dist < RANGE ? Math.atan2(dx, dz) : BASE_YAW;
        // shortest-arc easing toward the target yaw
        let diff = want - camRoot.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        camRoot.rotation.y += diff * Math.min(1, 4 * dt);
      },
      cleanup() {
        camRoot.rotation.y = home;
      },
    };
  },
};
