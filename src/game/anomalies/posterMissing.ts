/**
 * poster.missing — the middle notice-board poster is gone, leaving a bare
 * stretch of wall. Subtle count-and-placement bait.
 */
import type { AnomalyDef } from "./types";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";

export const posterMissing: AnomalyDef = {
  id: "poster.missing",
  displayName: "Missing Poster",
  chapter: 1,
  category: "object",
  detectability: "subtle",
  weight: 1,
  progressionRange: [0, 100],
  requires: ["poster.1"],
  excludes: ["wall.left.poster"],
  testSeed: "test.poster.missing",
  dangerous: false,
  activate(ctx) {
    const p = ctx.world.registry.mesh("poster.1");
    p.isVisible = false;
    // second tells — the bare frame edge still shows, and the fallen
    // sheet lies face-down on the floor below
    const frameMat = new StandardMaterial("mat.anomaly.pframe", ctx.scene);
    frameMat.diffuseColor = new Color3(0.08, 0.08, 0.085);
    const pp = p.getAbsolutePosition();
    const frame = CreatePlane("anomaly.poster.frame", { width: 0.66, height: 0.94 }, ctx.scene);
    frame.material = frameMat;
    frame.position.set(pp.x + 0.006, pp.y, pp.z);
    frame.rotation.y = -Math.PI / 2; // west wall, face +x
    const shardMat = new StandardMaterial("mat.anomaly.pshard", ctx.scene);
    shardMat.diffuseColor = new Color3(0.6, 0.58, 0.52);
    const shard = CreateBox("anomaly.poster.shard", { width: 0.5, height: 0.006, depth: 0.7 }, ctx.scene);
    shard.material = shardMat;
    shard.position.set(pp.x + 0.45, 0.008, pp.z + 0.15);
    shard.rotation.z = 0.5;
    return {
      update() {},
      cleanup() {
        p.isVisible = true;
        frame.dispose();
        shard.dispose();
        frameMat.dispose();
        shardMat.dispose();
      },
    };
  },
};
