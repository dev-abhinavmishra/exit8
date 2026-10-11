/**
 * feed.ahead — the feed shows you four seconds from now: the ringed dot
 * walks on ahead of where you stand, arriving at the mouth before you
 * do. When you stop, it stops — it only knows a future you keep giving it.
 */
import { drawFeed } from "../../world/generation/textures";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { AnomalyDef, AnomalyInstance } from "./types";

const AHEAD = 4.0;

export const feedAhead: AnomalyDef = {
  id: "feed.ahead",
  displayName: "It Shows You Next",
  chapter: 3,
  category: "object",
  detectability: "unmistakable",
  weight: 0.9,
  progressionRange: [45, 100],
  requires: ["feed.screen"],
  excludes: ["feed.lag", "feed.empty", "feed.figure", "feed.static"],
  testSeed: "test.feed.ahead",
  dangerous: false,
  activate(ctx): AnomalyInstance {
    const t = (
      ctx.world.registry.mesh("feed.screen").material as {
        emissiveTexture?: DynamicTexture;
      } | null
    )?.emissiveTexture;
    if (!t) return { update() {}, cleanup() {} };
    let lx = 0;
    let lz = 0;
    let vx = 0;
    let vz = 0;
    let acc = 0;
    return {
      update(dt: number) {
        const p = ctx.player.position;
        if (dt > 0) {
          // smoothed velocity — the future needs a heading
          vx = vx * 0.92 + ((p.x - lx) / dt) * 0.08;
          vz = vz * 0.92 + ((p.z - lz) / dt) * 0.08;
        }
        lx = p.x;
        lz = p.z;
        acc += dt;
        if (acc < 0.12) return;
        acc = 0;
        drawFeed(t, {
          px: p.x + vx * AHEAD,
          pz: Math.max(0, Math.min(55, p.z + vz * AHEAD)),
          wz: ctx.world.ambientWalker.root.position.z,
        });
      },
      cleanup() {},
    };
  },
};
