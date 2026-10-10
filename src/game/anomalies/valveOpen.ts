import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import type { AnomalyDef, AnomalyContext } from "./types";

// #260 valve.open — the gallery-stretch hose valve sits OPEN: the wheel
// turned a quarter and a whisper of air hisses from the drop when you
// stand under it. Baseline has both valves shut.
export const valveOpen: AnomalyDef = {
  id: "valve.open",
  displayName: "The Valve Is Open",
  chapter: 2,
  category: "object",
  detectability: "moderate",
  weight: 0.8,
  progressionRange: [25, 100],
  requires: ["pipe.valve.0"],
  excludes: ["corridor.mirror", "corridor.long", "corridor.narrow", "pipe.leaks"],
  testSeed: "test.valve.open",
  dangerous: false,
  activate(ctx: AnomalyContext) {
    const { scene, rng } = ctx;
    const valve = ctx.world.registry.get("pipe.valve.0");
    const baseRotY = valve.rotation.y;
    const p = valve.getAbsolutePosition();
    // wheel turned open
    valve.rotation.y = baseRotY + 0.42;
    // faint mist jet at the valve throat — a thin bright wisp
    const mistMat = new StandardMaterial("mat.anomaly.valvemist", scene);
    mistMat.diffuseColor = new Color3(0.6, 0.66, 0.68);
    mistMat.emissiveColor = new Color3(0.3, 0.33, 0.35);
    mistMat.alpha = 0.3;
    const mist = CreatePlane("anomaly.valve.mist", { width: 0.12, height: 0.34 }, scene);
    mist.material = mistMat;
    mist.position.set(p.x, p.y - 0.24, p.z + 0.05);
    mist.rotation.x = -0.5;
    mist.billboardMode = 2; // face camera on Y only
    let hissT = 0;
    let next = 1.4;
    let phase = 0;
    return {
      update(dt: number) {
        phase += dt;
        mist.scaling.y = 1 + Math.sin(phase * 2.3) * 0.12;
        hissT += dt;
        if (hissT >= next) {
          hissT = 0;
          next = 1.6 + rng.draw() * 1.8;
          ctx.audio.playSigh(new Vector3(p.x, p.y, p.z));
        }
      },
      cleanup() {
        valve.rotation.y = baseRotY;
        mist.dispose();
        mistMat.dispose();
      },
    };
  },
};
