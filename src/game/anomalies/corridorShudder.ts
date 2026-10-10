import type { AnomalyDef, AnomalyInstance } from "./types";

/**
 * corridor.shudder — the passage trembles: every zone's light dips in
 * unison, light shafts stutter, a held caption names it. ~9 s then it
 * stops — like something heavy passed under the floor. Unmistakable,
 * systemic.
 */
export const corridorShudder: AnomalyDef = {
  id: "corridor.shudder",
  displayName: "The Passage Trembles",
  chapter: 3,
  category: "systemic",
  detectability: "unmistakable",
  weight: 0.8,
  progressionRange: [30, 100],
  requires: ["clock.head"],
  excludes: ["corridor.flicker", "corridor.breathes", "lights.surge", "corridor.cold"],
  testSeed: "test.corridor.shudder",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const zones = ctx.world.zones;
    const base = zones.map((z) => z.point.intensity);
    let t = 0;
    let named = false;
    return {
      update(_dt: number) {
        t += _dt;
        if (!named && t > 0.8) {
          named = true;
          ctx.audio.caption("the passage trembles, then stills", null);
        }
        const window = t < 8.5 ? 1 : t < 10 ? (10 - t) / 1.5 : 0;
        const jolt = Math.sin(t * 31) * 0.22 + Math.sin(t * 53) * 0.1;
        zones.forEach((z, i) => {
          z.point.intensity = base[i]! * (1 - Math.max(0, jolt) * window);
        });
      },
      cleanup() {
        zones.forEach((z, i) => (z.point.intensity = base[i]!));
      },
    };
  },
};
