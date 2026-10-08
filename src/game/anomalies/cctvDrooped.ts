/**
 * cctv.drooped — one dome camera hangs tilted straight down, dead.
 * The other three still sweep the corridor. Subtle object-class
 * anomaly.
 */
import type { AnomalyDef } from "./types";

const CAMS = ["cctv.0", "cctv.1", "cctv.2", "cctv.3"];

export const cctvDrooped: AnomalyDef = {
  id: "cctv.drooped",
  displayName: "Camera Dead Drop",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["cctv.0", "cctv.1", "cctv.2", "cctv.3"],
  excludes: ["cctv", "cctv.all", "cctv.gaze", "cctv.sleeps"],
  testSeed: "test.cctv.drooped",
  dangerous: false,
  activate(ctx) {
    const id = ctx.rng.pick(CAMS);
    const cam = ctx.world.registry.get(id);
    const rx = cam.rotation.x;
    cam.rotation.x = rx + 0.9;
    return {
      update() {},
      cleanup() {
        cam.rotation.x = rx;
      },
    };
  },
};
