/**
 * cctv.all — every dome in the corridor turns to follow you at once.
 * Wherever you stand, four lenses are on you; walk, and they hand you
 * off down the line. Unmistakable once noticed.
 */
import type { AnomalyDef } from "./types";

const CAMS: { id: string; x: number; z: number; baseYaw: number }[] = [
  { id: "cctv.0", x: -1.6, z: 3, baseYaw: 0 },
  { id: "cctv.1", x: 1.6, z: 20, baseYaw: 0 },
  { id: "cctv.2", x: -1.6, z: 40, baseYaw: Math.PI },
  { id: "cctv.3", x: 1.6, z: 52, baseYaw: Math.PI },
];
const RANGE = 14;

export const cctvAll: AnomalyDef = {
  id: "cctv.all",
  displayName: "All Eyes",
  chapter: 2,
  category: "character",
  detectability: "unmistakable",
  weight: 0.7,
  progressionRange: [30, 100],
  requires: ["cctv.0", "cctv.1", "cctv.2", "cctv.3"],
  excludes: ["cctv"],
  testSeed: "test.cctv.all",
  dangerous: false,
  activate(ctx) {
    const roots = CAMS.map((c) => ({
      ...c,
      root: ctx.world.registry.get(c.id) as { rotation: { y: number } },
      home: (ctx.world.registry.get(c.id) as { rotation: { y: number } }).rotation.y,
    }));
    return {
      update(dt) {
        const p = ctx.player.position;
        for (const cam of roots) {
          const dx = p.x - cam.x;
          const dz = p.z - cam.z;
          const want = Math.hypot(dx, dz) < RANGE ? Math.atan2(dx, dz) : cam.baseYaw;
          let diff = want - cam.root.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          cam.root.rotation.y += diff * Math.min(1, 3 * dt);
        }
      },
      cleanup() {
        for (const cam of roots) cam.root.rotation.y = cam.home;
      },
    };
  },
};
