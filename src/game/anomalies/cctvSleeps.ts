/**
 * cctv.sleeps — the clinic-bend camera's red lens is dead. The dome still
 * hangs there; its watch-light is simply out. Subtle.
 */
import type { AnomalyDef } from "./types";

export const cctvSleeps: AnomalyDef = {
  id: "cctv.sleeps",
  displayName: "Sleeping Camera",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["cctv.2"],
  excludes: ["cctv"],
  testSeed: "test.cctv.sleeps",
  dangerous: false,
  activate(ctx) {
    const lens = ctx.scene.getMeshByName("cctv.2.lens");
    if (!lens) return { update() {}, cleanup() {} };
    lens.isVisible = false;
    return {
      update() {},
      cleanup() {
        lens.isVisible = true;
      },
    };
  },
};
