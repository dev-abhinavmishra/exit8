import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * clock.wrong — the clock reads 3:47, not 10:05. Both faces agree —
 * which is exactly the problem. Subtle.
 */
export const clockWrong: AnomalyDef = {
  id: "clock.wrong",
  displayName: "The Time Is Off",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 0.55,
  progressionRange: [20, 100],
  requires: ["clock.head"],
  excludes: ["clock.spin", "clock.fallen", "clock.back"],
  testSeed: "test.clock.wrong",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world } = ctx;
    const head = world.registry.mesh("clock.head");
    head.getChildMeshes(false).forEach((m) => {
      const s = m.name.includes(".n.") ? 1 : -1;
      if (m.name.endsWith(".h")) m.rotation.z = s * -1.95;
      if (m.name.endsWith(".m")) m.rotation.z = s * -4.9;
    });
    return {
      update() {},
      cleanup() {
        head.getChildMeshes(false).forEach((m) => {
          const s = m.name.includes(".n.") ? 1 : -1;
          if (m.name.endsWith(".h")) m.rotation.z = s * -0.62;
          if (m.name.endsWith(".m")) m.rotation.z = s * -0.42;
        });
      },
    };
  },
};
