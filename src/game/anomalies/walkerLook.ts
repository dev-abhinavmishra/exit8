/**
 * walker.look — the inspector keeps his route, every cadence the same,
 * but his head turns to follow you as you pass. The body never
 * acknowledges it; the face tracks you the whole length of the bank.
 * Moderate character-class anomaly.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

function wrapPi(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export const walkerLook: AnomalyDef = {
  id: "walker.look",
  displayName: "His Head Follows You",
  chapter: 3,
  category: "character",
  detectability: "moderate",
  weight: 0.65,
  progressionRange: [30, 100],
  requires: ["ambient.walker"],
  excludes: [
    "walker.absent",
    "walker.crawl",
    "walker.backwards",
    "walker.wait",
    "walker.midstep",
    "walker.stare",
    "walker.charge",
    "walker.faceless",
    "walker.eyeless",
    "walker.crowd",
    "walker.hum",
  ],
  testSeed: "test.walker.look",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene } = ctx;
    const head = scene.getTransformNodeByName("ambient.walker.headPivot");
    const skull = scene.getMeshByName("ambient.walker.head");
    const body = ctx.world.registry.get("ambient.walker");
    if (!head || !skull || !body) return { update() {}, cleanup() {} };
    let yaw = 0;
    return {
      update(dt) {
        const wp = skull.getAbsolutePosition();
        const pp = ctx.player.position;
        const dx = pp.x - wp.x;
        const dz = pp.z - wp.z;
        const dist = Math.hypot(dx, dz);
        // only track when near enough to notice — far away it relaxes
        let desired = 0;
        if (dist < 16 && dist > 0.5) {
          desired = Math.atan2(dx, dz) - body.rotation.y;
          desired = wrapPi(desired);
          desired = Math.max(-0.75, Math.min(0.75, desired));
        }
        yaw += (desired - yaw) * Math.min(1, dt * 4);
        head.rotation.y = yaw;
      },
      cleanup() {
        head.rotation.y = 0;
      },
    };
  },
};
