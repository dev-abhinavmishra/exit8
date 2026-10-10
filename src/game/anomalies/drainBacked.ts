import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { AnomalyDef, AnomalyContext } from "./types";

// #261 drain.backed — a stretch of the trench drain backs up: a long
// shallow film of water sits over the channel where the grating should
// be dry, plinking now and then.
export const drainBacked: AnomalyDef = {
  id: "drain.backed",
  displayName: "The Drain Backs Up",
  chapter: 1,
  category: "spatial",
  detectability: "subtle",
  weight: 0.85,
  progressionRange: [10, 100],
  requires: ["drain.channel"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "floor.flood"],
  testSeed: "test.drain.backed",
  dangerous: false,
  activate(ctx: AnomalyContext) {
    const { scene, rng } = ctx;
    const ch = ctx.world.registry.mesh("drain.channel");
    const p = ch.getAbsolutePosition();
    // a backed-up film across a three-metre clinic stretch
    // thin boxes — floor CreatePlanes don't render in the corridor
    const film = CreateBox("anomaly.drain.film", { width: 0.34, height: 0.006, depth: 3.2 }, scene);
    film.material = ctx.world.materials.puddle;
    film.position.set(p.x, 0.012, 36.4);
    // small gloss pool pushing out into the walk path at one end
    const lip = CreateBox("anomaly.drain.lip", { width: 0.5, height: 0.005, depth: 0.7 }, scene);
    lip.material = ctx.world.materials.puddle;
    lip.position.set(p.x + 0.25, 0.011, 37.6);
    let t = 0;
    let next = 2 + rng.draw() * 3;
    return {
      update(dt: number) {
        t += dt;
        if (t >= next) {
          t = 0;
          next = 2.4 + rng.draw() * 3.4;
          ctx.audio.playDrip(new Vector3(p.x, 0.1, 36.4));
        }
      },
      cleanup() {
        film.dispose();
        lip.dispose();
      },
    };
  },
};
