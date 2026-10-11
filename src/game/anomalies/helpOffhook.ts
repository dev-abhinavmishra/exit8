import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * help.offhook — the handset hangs by its cord off the hook, swung a
 * hand's width below the cradle. Somebody picked it up. Moderate.
 */
export const helpOffhook: AnomalyDef = {
  id: "help.offhook",
  displayName: "The Handset Is Off",
  chapter: 1,
  category: "object",
  detectability: "moderate",
  weight: 1.0,
  progressionRange: [10, 100],
  requires: ["help.handset"],
  excludes: ["help", "help.voice", "help.gone"],
  testSeed: "test.help.offhook",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const hs = ctx.world.registry.get("help.handset");
    const p = hs.position.clone();
    hs.position.set(p.x, p.y - 0.16, p.z + 0.05);
    hs.rotation.z = 0.5;
    return {
      update() {},
      cleanup() {
        hs.position.copyFrom(p);
        hs.rotation.z = 0;
      },
    };
  },
};
