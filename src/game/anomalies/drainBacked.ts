import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
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
    const film = CreatePlane("anomaly.drain.film", { width: 0.34, height: 3.2 }, scene);
    film.material = ctx.world.materials.puddle;
    film.position.set(p.x, 0.011, 36.4);
    film.rotation.x = Math.PI / 2;
    // small gloss pool pushing out into the walk path at one end
    const lip = CreatePlane("anomaly.drain.lip", { width: 0.5, height: 0.7 }, scene);
    lip.material = ctx.world.materials.puddle;
    lip.position.set(p.x + 0.25, 0.007, 37.6);
    lip.rotation.x = Math.PI / 2;
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
