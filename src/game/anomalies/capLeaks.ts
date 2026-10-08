/**
 * cap.leaks — the sealed end cap has a crack in it. A hairline of cold
 * light seeps through the plate where the wall was never supposed to
 * give — one jagged L of pale emission leaking out of whatever is on
 * the far side. Subtle at distance, unmistakable at the commit walk.
 */
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AnomalyDef, AnomalyInstance } from "./types";

export const capLeaks: AnomalyDef = {
  id: "cap.leaks",
  displayName: "The Cap Bleeds Light",
  chapter: 2,
  category: "lighting",
  detectability: "moderate",
  weight: 0.7,
  progressionRange: [25, 100],
  requires: ["al.north.cap"],
  excludes: ["airlock.breach", "figure.doubles", "figure.north", "face.pane.north"],
  testSeed: "test.cap.leaks",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const { scene, rng } = ctx;
    const cap = ctx.world.registry.mesh("al.north.cap");
    if (!cap) return { update() {}, cleanup() {} };

    const mat = new StandardMaterial("anomaly.capleak.mat", scene);
    mat.emissiveColor = new Color3(0.85, 0.9, 1.0).scale(1.7); // cold daylight seep
    mat.disableLighting = true;
    mat.specularColor = Color3.Black();

    const bits: { dispose(): void }[] = [];
    // sit proud of the cap's corridor face in world space — the local
    // parent chain puts small offsets inside the slab
    cap.computeWorldMatrix(true);
    const faceZ = cap.getBoundingInfo().boundingBox.maximumWorld.z + 0.006;
    const cx = rng.range(-0.7, 0.7);
    const cy = rng.range(0.9, 1.6);
    const vrun = CreatePlane("anomaly.capleak.v", { width: 0.035, height: rng.range(0.8, 1.2) }, scene);
    vrun.material = mat;
    vrun.parent = ctx.world.root;
    vrun.position = new Vector3(cx, cy, faceZ);
    vrun.rotation.y = Math.PI; // CreatePlane faces -z — turn it toward the corridor
    vrun.rotation.z = rng.range(-0.08, 0.08);
    const jog = CreatePlane("anomaly.capleak.h", { width: rng.range(0.14, 0.3), height: 0.016 }, scene);
    jog.material = mat;
    jog.parent = ctx.world.root;
    jog.rotation.y = Math.PI;
    jog.position = new Vector3(
      cx + rng.range(0.04, 0.09),
      cy + vrun.getBoundingInfo().boundingBox.extendSize.y * 0.8,
      faceZ,
    );
    jog.rotation.z = rng.range(-0.5, -0.15);
    bits.push(vrun, jog);
    // the leak spills a pale pool onto the vestibule floor under the crack
    const poolMat = new StandardMaterial("anomaly.capleak.poolmat", scene);
    poolMat.emissiveColor = new Color3(0.5, 0.56, 0.66).scale(0.8);
    poolMat.disableLighting = true;
    poolMat.specularColor = Color3.Black();
    const pool = CreatePlane("anomaly.capleak.pool", { width: 0.5, height: 0.9 }, scene);
    pool.material = poolMat;
    pool.parent = ctx.world.root;
    pool.position = new Vector3(cx, 0.014, faceZ + 0.45);
    pool.rotation.x = Math.PI / 2;
    bits.push(pool);
    return {
      update() {},
      cleanup() {
        for (const b of bits) b.dispose();
        mat.dispose();
      },
    };
  },
};
