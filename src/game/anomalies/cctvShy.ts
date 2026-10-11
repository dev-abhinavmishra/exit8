/**
 * cctv.shy — it only watches when you aren't looking. While your view
 * is anywhere else the head tracks you like a curious animal; raise
 * your view to it and it has already swung away, aimed at the far
 * corner like it was always staring there. Deep-shift character
 * anomaly — the corridor's coldest surveillance beat.
 */
import type { AnomalyDef } from "./types";

export const cctvShy: AnomalyDef = {
  id: "cctv.shy",
  displayName: "It Looks Away",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.75,
  progressionRange: [35, 100],
  requires: ["cctv"],
  excludes: ["cctv.follows", "cctv.dead", "cctv.inward"],
  testSeed: "test.cctv.shy",
  dangerous: false,
  activate(ctx) {
    const head = ctx.scene.getTransformNodeByName("cctv.head");
    if (!head) return { update() {}, cleanup() {} };
    const baseX = head.rotation.x;
    let shy = 0; // 0 = watching, 1 = looking away
    return {
      update(dt: number) {
        const p = ctx.player.position;
        const h = head.getAbsolutePosition();
        const dx = h.x - p.x;
        const dz = h.z - p.z;
        const len = Math.hypot(dx, dz) || 1;
        const fwd = ctx.player.forward();
        const watching = fwd.x * (dx / len) + fwd.z * (dz / len) > 0.62;
        shy += (watching ? 1 : -1) * dt * 5;
        shy = Math.max(0, Math.min(1, shy));
        if (shy >= 1) {
          // dead-stare into the near corner — the pose it keeps for
          // anyone watching
          head.rotation.y = -0.9;
          head.rotation.x = 0.9;
          return;
        }
        const yaw = Math.atan2(p.x - h.x, p.z - h.z) + Math.PI / 2;
        const track = Math.max(-1.15, Math.min(1.15, yaw));
        head.rotation.y = track + (-0.9 - track) * shy;
        head.rotation.x = baseX * 0.6 + (0.9 - baseX * 0.6) * shy;
      },
      cleanup() {
        head.rotation.y = 0;
        head.rotation.x = baseX;
      },
    };
  },
};
