/**
 * bay.valve — inside the machinery bay, the red handwheel on the pipe
 * run is slowly turning. Nobody is holding it. The wheel creeps a few
 * degrees a second with an intermittent bearing creak — subtle through
 * the mouth, obvious at the threshold. The bay's machine is alive.
 */
import type { AnomalyDef, AnomalyInstance } from "./types";

export const bayValve: AnomalyDef = {
  id: "bay.valve",
  displayName: "The Wheel Turns",
  chapter: 2,
  category: "object",
  detectability: "subtle",
  weight: 0.9,
  progressionRange: [20, 100],
  requires: [
    "junction.bayvalve",
    "junction.bayvalvespoke.0",
    "junction.bayvalvespoke.1",
    "junction.bayvalvespoke.2",
    "junction.bayvalvespoke.3",
  ],
  excludes: ["bay.occupied"],
  testSeed: "test.bay.valve",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { world, rng } = ctx;
    const spokes = [0, 1, 2, 3].map((i) => world.registry.mesh(`junction.bayvalvespoke.${i}`));
    const home = spokes.map((s) => s.rotation.x);
    const valve = world.registry.mesh("junction.bayvalve");
    const rate = rng.range(0.5, 0.85);
    const valvePos = valve.position.clone();
    let creakT = rng.range(0.5, 1.2);
    return {
      update(dt) {
        spokes.forEach((s) => {
          s.rotation.x += dt * rate;
        });
        creakT -= dt;
        if (creakT <= 0) {
          creakT = rng.range(1.6, 3.4);
          ctx.audio.playWaterPlink(valvePos.clone());
        }
      },
      cleanup() {
        spokes.forEach((s, i) => {
          s.rotation.x = home[i]!;
        });
      },
    };
  },
};
