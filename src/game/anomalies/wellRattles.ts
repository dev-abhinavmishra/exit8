import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * well.rattles — stand over the well and the cover starts to shiver
 * on its seat, like something below answering your weight. Step off
 * and it stills. It only wants you to notice it notices.
 */
export const wellRattles: AnomalyDef = {
  id: "well.rattles",
  displayName: "It Feels Your Weight",
  chapter: 2,
  category: "spatial",
  detectability: "moderate",
  weight: 0.9,
  progressionRange: [12, 100],
  requires: ["well.cover"],
  excludes: ["well.ajar", "well.lifted", "well.grip", "well.riser"],
  testSeed: "test.well.rattles",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const cover = ctx.world.registry.get("well.cover");
    const rest = cover.position.clone();
    let t = 0;
    let energy = 0; // rises while the player stands over the mouth
    return {
      update(dt) {
        t += dt;
        const p = ctx.player.position;
        const dx = p.x - -0.85;
        const dz = p.z - 31.0;
        const near = dx * dx + dz * dz < 1.9 * 1.9;
        energy = Math.max(0, Math.min(1, energy + (near ? dt * 0.8 : -dt * 1.4)));
        const amp = energy * 0.0022;
        cover.position.y = rest.y + Math.sin(t * 41) * amp;
        cover.position.z = rest.z + Math.sin(t * 33 + 1.2) * amp * 0.6;
      },
      cleanup() {
        cover.position = rest;
      },
    };
  },
};
