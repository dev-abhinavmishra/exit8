import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * alarm.lever.drops — linger near the pull station and the lever
 * eases itself down, degree by degree, toward tripped. Walk away
 * and it sits wherever you left it. Something is asking.
 */
export const alarmLeverDrops: AnomalyDef = {
  id: "alarm.lever.drops",
  displayName: "It Pulls Itself",
  chapter: 2,
  category: "character",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [12, 100],
  requires: ["alarm.lever"],
  excludes: ["alarm.pulled", "alarm.gone"],
  testSeed: "test.alarm.lever.drops",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const lever = ctx.world.registry.mesh("alarm.lever");
    let pull = 0; // 0..1 eased pull amount
    return {
      update(dt) {
        const p = ctx.player.position;
        const dx = p.x - 1.76;
        const dz = p.z - 47.0;
        const near = dx * dx + dz * dz < 2.2 * 2.2;
        if (near) pull = Math.min(1, pull + dt * 0.22);
        // no release — it sits wherever you left it
        lever.rotation.x = pull * 0.95;
      },
      cleanup() {
        lever.rotation.x = 0;
      },
    };
  },
};
